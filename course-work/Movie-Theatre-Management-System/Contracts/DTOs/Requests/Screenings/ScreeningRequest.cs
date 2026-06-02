using Microsoft.EntityFrameworkCore;
using MovieTheatre.Data.Enums;
using System.ComponentModel.DataAnnotations;

namespace MovieTheatre.Contracts.DTOs.Requests.Screenings
{
    public class ScreeningRequest
    {
        [Required(ErrorMessage = "Start time cannot be empty")]
        public required DateTime StartTime { get; set; }

        [Required(ErrorMessage = "End time cannot be empty")]
        public required DateTime EndTime { get; set; }

        [Required(ErrorMessage = "Price cannot be empty")]
        [Precision(18, 2)]
        public required decimal Price { get; set; }

        [Required(ErrorMessage = "Screening type cannot be empty")]
        public ScreeningTypes Type { get; set; }

        public Guid MovieId { get; set; }
        public Guid HallId { get; set; }

    }
}
