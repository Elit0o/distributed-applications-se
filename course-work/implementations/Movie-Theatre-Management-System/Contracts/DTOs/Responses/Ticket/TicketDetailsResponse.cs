using MovieTheatre.Contracts.DTOs.Responses.Screenings;

namespace MovieTheatre.Contracts.DTOs.Responses.Ticket
{
    public class TicketDetailsResponse
    {
        public Guid Id { get; set; }
        public byte SeatNum { get; set; }
        public DateTime PurchasedAt { get; set; }
        public string? PhoneNumber { get; set; }
        public ScreeningDetailsResponse ScreeningDetails { get; set; }
    }
}
