package main

import (
	"context"
	"log"
	"net"

	"BabyBounty/internal/domain"
	pb "BabyBounty/proto"

	"google.golang.org/grpc"
)

// GiftServiceServer implements the gRPC service
type GiftServiceServer struct {
	pb.UnimplementedGiftServiceServer
	service domain.GiftService
}

func NewGiftServiceServer(service domain.GiftService) *GiftServiceServer {
	return &GiftServiceServer{service: service}
}

func (s *GiftServiceServer) GetGift(ctx context.Context, req *pb.GetGiftRequest) (*pb.GetGiftResponse, error) {
	gift, err := s.service.GetGift(req.Id)
	if err != nil {
		return nil, err
	}
	return &pb.GetGiftResponse{Gift: gift}, nil
}

func (s *GiftServiceServer) ListGift(ctx context.Context, req *pb.ListGiftRequest) (*pb.ListGiftResponse, error) {
	gifts, err := s.service.ListGift()
	if err != nil {
		return nil, err
	}
	return &pb.ListGiftResponse{Gifts: gifts}, nil
}

func (s *GiftServiceServer) AddGift(ctx context.Context, req *pb.AddGiftRequest) (*pb.AddGiftResponse, error) {
	message, err := s.service.AddGift(req.Gift)
	if err != nil {
		return nil, err
	}
	return &pb.AddGiftResponse{Message: message}, nil
}

func (s *GiftServiceServer) RemoveGift(ctx context.Context, req *pb.RemoveGiftRequest) (*pb.RemoveGiftResponse, error) {
	message, err := s.service.RemoveGift(req.Id)
	if err != nil {
		return nil, err
	}
	return &pb.RemoveGiftResponse{Message: message}, nil
}

func (s *GiftServiceServer) ReserveGift(ctx context.Context, req *pb.ReserveGiftRequest) (*pb.ReserveGiftResponse, error) {
	message, err := s.service.ReserveGift(req.Id, req.ReservedBy)
	if err != nil {
		return nil, err
	}
	return &pb.ReserveGiftResponse{Message: message}, nil
}

func main() {
	listener, err := net.Listen("tcp", ":50051")
	if err != nil {
		log.Fatalf("Failed to listen: %v", err)
	}

	grpcServer := grpc.NewServer()
	service := domain.NewGiftService()
	pb.RegisterGiftServiceServer(grpcServer, NewGiftServiceServer(service))

	log.Println("GiftService gRPC server is running on port 50051")
	if err := grpcServer.Serve(listener); err != nil {
		log.Fatalf("Failed to serve: %v", err)
	}
}
