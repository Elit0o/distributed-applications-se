using System.ComponentModel.DataAnnotations;

namespace MovieTheatre.Contracts.DTOs.Requests.Movies
{
    public class MovieRequest
    {
        [MinLength(2)]
        [MaxLength(50)]
        [Required(ErrorMessage = "Title cannot be empty")]
        public required string Title { get; set; }

        [MinLength(2)]
        [MaxLength(20)]
        [Required(ErrorMessage = "Genre cannot be empty")]
        public required string Genre { get; set; }

        [Required(ErrorMessage = "Release date cannot be empty")]
        public DateTime ReleaseDate { get; set; }

        [Required(ErrorMessage = "Duration cannot be empty")]
        public int DurationMinutes { get; set; }

        [MinLength(5)]
        [MaxLength(1000)]
        [Required(ErrorMessage = "Description cannot be empty")]
        public required string Description { get; set; }

        [Range(0, 5)]
        public float Rating { get; set; }
    }
}
