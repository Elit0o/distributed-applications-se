using System.Runtime.Serialization;

namespace RideSharing.Contracts;

[DataContract(Namespace = "http://schemas.datacontract.org/2004/07/RideSharing.Contracts")]
public enum RideStatus
{
    [EnumMember]
    Created = 0,

    [EnumMember]
    Processing = 1,

    [EnumMember]
    Assigned = 2,

    [EnumMember]
    Completed = 3,

    [EnumMember]
    Cancelled = 4
}
