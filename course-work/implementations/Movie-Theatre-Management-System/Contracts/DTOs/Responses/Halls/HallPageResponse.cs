namespace MovieTheatre.Contracts.DTOs.Responses.Halls
{
    public class HallPageResponse : PageResponse<HallResponse>
    {
        public int? MinSeatCount { get; set; }
        public int? MaxSeatCount { get; set; }
        public bool? Is3D { get; set; }
    }
}
