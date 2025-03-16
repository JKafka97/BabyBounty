package repository

import (
	"database/sql"
	"errors"

	_ "github.com/lib/pq" // PostgreSQL driver
	pb "BabyBounty/proto"
)

type GiftRepository interface {
	GetGift(id string) (*pb.Gift, error)
	ListGift() ([]*pb.Gift, error)
	AddGift(gift *pb.Gift) error
	RemoveGift(id string) error
	ReserveGift(id, reservedBy string) error
}

type giftRepository struct {
	db *sql.DB
}

func NewGiftRepository(db *sql.DB) GiftRepository {
	return &giftRepository{db: db}
}

func (r *giftRepository) GetGift(id string) (*pb.Gift, error) {
	gift := &pb.Gift{}
	err := r.db.QueryRow("SELECT id, name, description, price, recipient, reserved, reserved_by FROM gifts WHERE id = $1", id).
		Scan(&gift.Id, &gift.Name, &gift.Description, &gift.Price, &gift.Recipient, &gift.Reserved, &gift.ReservedBy)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("gift not found")
		}
		return nil, err
	}
	return gift, nil
}

func (r *giftRepository) ListGift() ([]*pb.Gift, error) {
	rows, err := r.db.Query("SELECT id, name, description, price, recipient, reserved, reserved_by FROM gifts")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var gifts []*pb.Gift
	for rows.Next() {
		gift := &pb.Gift{}
		if err := rows.Scan(&gift.Id, &gift.Name, &gift.Description, &gift.Price, &gift.Recipient, &gift.Reserved, &gift.ReservedBy); err != nil {
			return nil, err
		}
		gifts = append(gifts, gift)
	}
	return gifts, nil
}

func (r *giftRepository) AddGift(gift *pb.Gift) error {
	_, err := r.db.Exec("INSERT INTO gifts (id, name, description, price, recipient, reserved, reserved_by) VALUES ($1, $2, $3, $4, $5, $6, $7)",
		gift.Id, gift.Name, gift.Description, gift.Price, gift.Recipient, gift.Reserved, gift.ReservedBy)
	return err
}

func (r *giftRepository) RemoveGift(id string) error {
	_, err := r.db.Exec("DELETE FROM gifts WHERE id = $1", id)
	return err
}

func (r *giftRepository) ReserveGift(id, reservedBy string) error {
	result, err := r.db.Exec("UPDATE gifts SET reserved = TRUE, reserved_by = $1 WHERE id = $2 AND reserved = FALSE", reservedBy, id)
	if err != nil {
		return err
	}
	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		return errors.New("gift not found or already reserved")
	}
	return nil
}
