namespace MovieTheatre.Contracts.DTOs.Responses
{
    public class PageResponse<T>
    {
        public IEnumerable<T> Items { get; set; } = new List<T>();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
        public bool HasNextPage => Page < TotalPages;
        public bool HasPrevPage => Page > 1;
        public bool IsDescending { get; set; }
    }
}
