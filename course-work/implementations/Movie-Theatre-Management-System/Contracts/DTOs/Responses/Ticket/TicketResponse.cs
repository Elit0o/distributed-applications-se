namespace MovieTheatre.Contracts.DTOs.Responses.Ticket
{
    public class TicketResponse
    {
        public Guid Id { get; set; }
        public required byte SeatNum { get; set; }
        public DateTime PurchasedAt { get; set; }
        public string? PhoneNumber { get; set; }
        public string MovieTitle { get; set; }
        public DateTime ScreeningStartTime { get; set; }
    }
}
