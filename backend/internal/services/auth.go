package services

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/AndriiBurii/uav-calculator/internal/config"
	"github.com/AndriiBurii/uav-calculator/internal/models"
	"github.com/golang-jwt/jwt/v5"
	"github.com/redis/go-redis/v9"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AuthService struct {
	db  *gorm.DB
	rdb *redis.Client
	cfg *config.Config
}

func NewAuthService(db *gorm.DB, rdb *redis.Client, cfg *config.Config) *AuthService {
	return &AuthService{db: db, rdb: rdb, cfg: cfg}
}

func (s *AuthService) Register(email, password, name string) (*models.User, error) {
	var existing models.User
	if err := s.db.Where("email = ?", email).First(&existing).Error; err == nil {
		return nil, errors.New("email already in use")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := &models.User{
		Email:        email,
		PasswordHash: string(hash),
		Name:         name,
	}

	if err := s.db.Create(user).Error; err != nil {
		return nil, err
	}

	return user, nil
}

func (s *AuthService) Login(email, password string) (*models.User, string, string, error) {
	var user models.User
	if err := s.db.Where("email = ?", email).First(&user).Error; err != nil {
		return nil, "", "", errors.New("invalid credentials")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, "", "", errors.New("invalid credentials")
	}

	accessToken, err := s.generateAccessToken(user.ID)
	if err != nil {
		return nil, "", "", err
	}

	refreshToken, err := s.generateRefreshToken(user.ID)
	if err != nil {
		return nil, "", "", err
	}

	key := fmt.Sprintf("refresh:%d:%s", user.ID, refreshToken[:16])
	s.rdb.Set(context.Background(), key, user.ID, s.cfg.JWT.RefreshTTL)

	return &user, accessToken, refreshToken, nil
}

func (s *AuthService) Refresh(refreshToken string) (string, error) {
	token, err := jwt.Parse(refreshToken, func(t *jwt.Token) (interface{}, error) {
		return []byte(s.cfg.JWT.RefreshSecret), nil
	})
	if err != nil || !token.Valid {
		return "", errors.New("invalid refresh token")
	}

	claims := token.Claims.(jwt.MapClaims)
	userID := uint(claims["user_id"].(float64))

	key := fmt.Sprintf("refresh:%d:%s", userID, refreshToken[:16])
	if err := s.rdb.Get(context.Background(), key).Err(); err != nil {
		return "", errors.New("refresh token not found or expired")
	}

	return s.generateAccessToken(userID)
}

func (s *AuthService) Logout(userID uint, refreshToken string) error {
	key := fmt.Sprintf("refresh:%d:%s", userID, refreshToken[:16])
	return s.rdb.Del(context.Background(), key).Err()
}

func (s *AuthService) generateAccessToken(userID uint) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(s.cfg.JWT.AccessTTL).Unix(),
		"type":    "access",
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.cfg.JWT.AccessSecret))
}

func (s *AuthService) generateRefreshToken(userID uint) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(s.cfg.JWT.RefreshTTL).Unix(),
		"type":    "refresh",
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.cfg.JWT.RefreshSecret))
}
