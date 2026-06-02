namespace MovieTheatre.Contracts.DTOs.Requests.Halls
{
    public class HallPageRequest : PageRequest
    {
        public int? MinSeatCount { get; set; }
        public int? MaxSeatCount { get; set; }
        public bool? Is3D { get; set; }
    }
}
