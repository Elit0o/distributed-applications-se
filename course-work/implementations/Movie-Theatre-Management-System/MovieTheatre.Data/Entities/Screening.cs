using Microsoft.EntityFrameworkCore;
using MovieTheatre.Data.Enums;
using System.ComponentModel.DataAnnotations;

namespace MovieTheatre.Data.Entities
{
    public class Screening : BaseEntity
    {
        [Required(ErrorMessage = "Start time cannot be empty")]
        public required DateTime StartTime { get; set; }

        [Required(ErrorMessage = "End time cannot be empty")]
        public required DateTime EndTime { get; set; }

        [Required(ErrorMessage = "Price cannot be empty")]
        [Precision(18,2)]
        public required decimal Price { get; set; }

        [Required(ErrorMessage = "Screening type cannot be empty")]
        public ScreeningTypes Type { get; set; }

        public virtual Movie Movie { get; set; }
        public Guid MovieId { get; set; }

        public virtual Hall Hall { get; set; }
        public Guid HallId { get; set; }

        public virtual ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
    }
}
