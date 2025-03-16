package domain

import (
	"errors"
	pb "BabyBounty/proto"
)

type GiftService interface {
	GetGift(id string) (*pb.Gift, error)
	ListGift() ([]*pb.Gift, error)
	AddGift(gift *pb.Gift) (string, error)
	RemoveGift(id string) (string, error)
	ReserveGift(id, reservedBy string) (string, error)
}

type giftService struct {
	gifts map[string]*pb.Gift
}

func NewGiftService() GiftService {
	return &giftService{
		gifts: make(map[string]*pb.Gift),
	}
}

func (s *giftService) GetGift(id string) (*pb.Gift, error) {
	gift, exists := s.gifts[id]
	if !exists {
		return nil, errors.New("gift not found")
	}
	return gift, nil
}

func (s *giftService) ListGift() ([]*pb.Gift, error) {
	var giftList []*pb.Gift
	for _, gift := range s.gifts {
		giftList = append(giftList, gift)
	}
	return giftList, nil
}

func (s *giftService) AddGift(gift *pb.Gift) (string, error) {
	if _, exists := s.gifts[gift.Id]; exists {
		return "", errors.New("gift already exists")
	}
	s.gifts[gift.Id] = gift
	return "Gift added successfully", nil
}

func (s *giftService) RemoveGift(id string) (string, error) {
	if _, exists := s.gifts[id]; !exists {
		return "", errors.New("gift not found")
	}
	delete(s.gifts, id)
	return "Gift removed successfully", nil
}

func (s *giftService) ReserveGift(id, reservedBy string) (string, error) {
	gift, exists := s.gifts[id]
	if !exists {
		return "", errors.New("gift not found")
	}
	if gift.Reserved {
		return "", errors.New("gift is already reserved")
	}
	gift.Reserved = true
	gift.ReservedBy = reservedBy
	return "Gift reserved successfully", nil
}
