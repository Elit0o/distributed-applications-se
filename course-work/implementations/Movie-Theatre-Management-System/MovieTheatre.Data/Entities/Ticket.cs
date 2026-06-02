using System.ComponentModel.DataAnnotations;

namespace MovieTheatre.Data.Entities
{
    public class Ticket : BaseEntity
    {
        [Required(ErrorMessage = "Seat number cannot be empty")]
        public required byte SeatNum { get; set; }
        public DateTime PurchasedAt { get; set; }

        [MaxLength(15)]
        public string? PhoneNumber { get; set; }


        public virtual Screening Screening { get; set; }
        public Guid ScreeningId { get; set; }

        public virtual User User { get; set; }
        public Guid UserId { get; set; }
    }
}
