using System.ComponentModel.DataAnnotations;

namespace MovieTheatre.Data.Entities
{
    public class User : BaseEntity
    {
        [MaxLength(20)]
        public string? FName { get; set; }

        [MaxLength(20)]
        public string? LName { get; set; }

        [MinLength(2)]
        [MaxLength(20)]
        [Required(ErrorMessage = "Username cannot be empty")]
        public required string Username { get; set; }

        [MinLength(5)]
        [MaxLength(20)]
        [Required(ErrorMessage = "Password cannot be empty")]
        public required string PasswordHash { get; set; }

        [Required(ErrorMessage = "Birth date cannot be empty")]
        public DateTime Birthday { get; set; }

        public bool IsAdmin { get; set; } = false;

        public virtual ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
    }
}
