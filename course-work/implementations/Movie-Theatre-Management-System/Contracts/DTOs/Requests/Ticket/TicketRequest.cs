using System.ComponentModel.DataAnnotations;

namespace MovieTheatre.Contracts.DTOs.Requests.Ticket
{
    public class TicketRequest
    {
        [Required(ErrorMessage = "Seat number cannot be empty")]
        public required byte SeatNum { get; set; }
        public DateTime PurchasedAt { get; set; }

        [MaxLength(15)]
        public string? PhoneNumber { get; set; }
        public Guid ScreeningId { get; set; }
    }
}
