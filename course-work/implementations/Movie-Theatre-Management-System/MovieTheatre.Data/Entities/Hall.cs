using MovieTheatre.Data.Enums;
using System.ComponentModel.DataAnnotations;

namespace MovieTheatre.Data.Entities
{
    public class Hall : BaseEntity
    {
        [Required(ErrorMessage = "Hall number cannot be empty")]
        public required byte HallNum { get; set; } //0-255

        [Required(ErrorMessage = "Seats count cannot be empty")]
        public required ushort SeatsCount { get; set; } //0-65,535
        public bool Is3D { get; set; } = false;

        [Required(ErrorMessage = "Sound system cannot be empty")]
        public SoundSystems SoundSystem { get; set; }
        public bool IsPremium { get; set; } = false;

        public virtual ICollection<Screening> Screenings { get; set; } = new List<Screening>();
    }
}
