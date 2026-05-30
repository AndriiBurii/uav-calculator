package models

import (
	"time"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type AircraftConfig struct {
	ID         uint           `gorm:"primaryKey" json:"id"`
	UserID     uint           `gorm:"not null;index" json:"user_id"`
	User       User           `gorm:"foreignKey:UserID" json:"-"`
	Name       string         `gorm:"not null" json:"name"`
	WingType   string         `gorm:"not null" json:"wing_type"`
	TailType   string         `gorm:"not null" json:"tail_type"`
	ConfigData datatypes.JSON `gorm:"type:jsonb;not null" json:"config_data"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`
}

type Calculation struct {
	ID         uint           `gorm:"primaryKey" json:"id"`
	UserID     uint           `gorm:"not null;index" json:"user_id"`
	ConfigID   *uint          `gorm:"index" json:"config_id,omitempty"`
	Type       string         `gorm:"not null" json:"type"`
	InputData  datatypes.JSON `gorm:"type:jsonb;not null" json:"input_data"`
	ResultData datatypes.JSON `gorm:"type:jsonb;not null" json:"result_data"`
	CreatedAt  time.Time      `json:"created_at"`
}

type CatapultConfig struct {
	ID         uint           `gorm:"primaryKey" json:"id"`
	UserID     uint           `gorm:"not null;index" json:"user_id"`
	User       User           `gorm:"foreignKey:UserID" json:"-"`
	Name       string         `gorm:"not null" json:"name"`
	ConfigData datatypes.JSON `gorm:"type:jsonb;not null" json:"config_data"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`
}
