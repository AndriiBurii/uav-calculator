package handlers

import (
	"net/http"
	"strconv"

	"github.com/AndriiBurii/uav-calculator/internal/models"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type CatapultHandler struct {
	db *gorm.DB
}

func NewCatapultHandler(db *gorm.DB) *CatapultHandler {
	return &CatapultHandler{db: db}
}

func (h *CatapultHandler) List(c *gin.Context) {
	userID := c.GetUint("user_id")
	var configs []models.CatapultConfig
	h.db.Where("user_id = ?", userID).Find(&configs)
	c.JSON(http.StatusOK, gin.H{"configs": configs})
}

func (h *CatapultHandler) Create(c *gin.Context) {
	userID := c.GetUint("user_id")
	var cfg models.CatapultConfig
	if err := c.ShouldBindJSON(&cfg); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	cfg.UserID = userID
	if err := h.db.Create(&cfg).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create config"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"config": cfg})
}

func (h *CatapultHandler) Get(c *gin.Context) {
	userID := c.GetUint("user_id")
	id, _ := strconv.Atoi(c.Param("id"))
	var cfg models.CatapultConfig
	if err := h.db.Where("id = ? AND user_id = ?", id, userID).First(&cfg).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "config not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"config": cfg})
}

func (h *CatapultHandler) Update(c *gin.Context) {
	userID := c.GetUint("user_id")
	id, _ := strconv.Atoi(c.Param("id"))
	var cfg models.CatapultConfig
	if err := h.db.Where("id = ? AND user_id = ?", id, userID).First(&cfg).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "config not found"})
		return
	}
	if err := c.ShouldBindJSON(&cfg); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	h.db.Save(&cfg)
	c.JSON(http.StatusOK, gin.H{"config": cfg})
}

func (h *CatapultHandler) Delete(c *gin.Context) {
	userID := c.GetUint("user_id")
	id, _ := strconv.Atoi(c.Param("id"))
	if err := h.db.Where("id = ? AND user_id = ?", id, userID).Delete(&models.CatapultConfig{}).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "config not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}
