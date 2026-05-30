package main

import (
	"fmt"
	"log"

	"github.com/AndriiBurii/uav-calculator/internal/config"
	"github.com/AndriiBurii/uav-calculator/internal/database"
	"github.com/AndriiBurii/uav-calculator/internal/handlers"
	"github.com/AndriiBurii/uav-calculator/internal/middleware"
	"github.com/AndriiBurii/uav-calculator/internal/models"
	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()

	db := database.NewPostgres(cfg.Postgres.DSN)

	if err := db.AutoMigrate(&models.User{}, &models.AircraftConfig{}, &models.Calculation{}); err != nil {
		log.Fatalf("Migration failed: %v", err)
	}

	if err := db.AutoMigrate(
		&models.User{},
		&models.AircraftConfig{},
		&models.Calculation{},
		&models.CatapultConfig{},
	); err != nil {
		log.Fatalf("Migration failed: %v", err)
	}

	rdb := database.NewRedis(cfg.Redis.Addr, cfg.Redis.Password)

	if cfg.App.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()

	r.Use(middleware.CORS(cfg.App.CORSOrigins))

	authHandler := handlers.NewAuthHandler(db, rdb, cfg)
	configHandler := handlers.NewConfigHandler(db)

	api := r.Group("/api/v1")
	{
		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.POST("/refresh", authHandler.Refresh)
			auth.POST("/logout", authHandler.Logout)
		}

		protected := api.Group("/")
		protected.Use(middleware.Auth(cfg.JWT.AccessSecret))
		{
			protected.GET("/profile", authHandler.Profile)

			protected.GET("/configs", configHandler.List)
			protected.POST("/configs", configHandler.Create)
			protected.GET("/configs/:id", configHandler.Get)
			protected.PUT("/configs/:id", configHandler.Update)
			protected.DELETE("/configs/:id", configHandler.Delete)
		}

		catapultHandler := handlers.NewCatapultHandler(db)

		protected.GET("/catapult-configs", catapultHandler.List)
		protected.POST("/catapult-configs", catapultHandler.Create)
		protected.GET("/catapult-configs/:id", catapultHandler.Get)
		protected.PUT("/catapult-configs/:id", catapultHandler.Update)
		protected.DELETE("/catapult-configs/:id", catapultHandler.Delete)
	}

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	addr := fmt.Sprintf(":%s", cfg.App.Port)
	log.Printf("Server starting on %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
