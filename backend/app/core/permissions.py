from enum import Enum


class RoleEnum(str, Enum):
    ADMIN = "admin"
    CUSTOMER = "customer"
    STAFF = "staff"


class OrderStatusEnum(str, Enum):
    PENDING = "Pending"
    CONFIRMED = "Confirmed"
    PREPARING = "Preparing"
    READY_FOR_DISPATCH = "Ready for Dispatch"
    OUT_FOR_DELIVERY = "Out for Delivery"
    DELIVERED = "Delivered"
    CANCELLED = "Cancelled"
    FAILED = "Failed"
