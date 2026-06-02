using MovieTheatre.Contracts.DTOs.Responses.Screenings;

namespace MovieTheatre.Contracts.DTOs.Responses.Halls
{
    public class HallDetailsResponse
    {
        public Guid Id { get; set; }
        public byte HallNum { get; set; } //0-255
        public ushort SeatsCount { get; set; } //0-65,535
        public bool Is3D { get; set; } = false;
        public string SoundSystem { get; set; }
        public bool IsPremium { get; set; } = false;
        public List<ScreeningResponse> Screenings{ get; set; }
    }
}
