using MovieTheatre.Data.Enums;
using System.ComponentModel.DataAnnotations;

namespace MovieTheatre.Contracts.DTOs.Requests.Halls
{
    public class HallRequest
    {
        [Required(ErrorMessage = "Hall number cannot be empty")]
        public required byte HallNum { get; set; } //0-255

        [Required(ErrorMessage = "Seats count cannot be empty")]
        public required ushort SeatsCount { get; set; } //0-65,535
        public bool Is3D { get; set; } = false;

        [Required(ErrorMessage = "Sound system cannot be empty")]
        public SoundSystems SoundSystem { get; set; }
        public bool IsPremium { get; set; } = false;
    }
}
