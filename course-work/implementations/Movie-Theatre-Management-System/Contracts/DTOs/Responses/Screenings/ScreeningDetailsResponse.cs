using MovieTheatre.Contracts.DTOs.Responses.Ticket;
using MovieTheatre.Data.Enums;

namespace MovieTheatre.Contracts.DTOs.Responses.Screenings
{
    public class ScreeningDetailsResponse
    {
        public Guid Id { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public decimal Price { get; set; }
        public ScreeningTypes Type { get; set; }
        public Guid MovieId { get; set; }
        public Guid HallId { get; set; }

        public List<TicketResponse> Tickets { get; set; }
    }
}
