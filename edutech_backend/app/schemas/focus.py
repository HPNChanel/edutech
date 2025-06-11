from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class FocusSessionBase(BaseModel):
    duration_minutes: int = Field(..., ge=1, le=180, description="Duration in minutes (1-180)")
    session_type: str = Field(default="focus", description="Type of session: focus, break, long_break")
    notes: Optional[str] = Field(None, max_length=500, description="Optional notes for the session")

class FocusSessionCreate(FocusSessionBase):
    pass

class FocusSessionUpdate(BaseModel):
    actual_duration_minutes: Optional[int] = Field(None, ge=0, le=180)
    completed_at: Optional[datetime] = None
    is_completed: Optional[bool] = None
    notes: Optional[str] = Field(None, max_length=500)

class FocusSessionResponse(FocusSessionBase):
    id: int
    user_id: int
    actual_duration_minutes: Optional[int] = None
    started_at: datetime
    completed_at: Optional[datetime] = None
    is_completed: bool

    class Config:
        from_attributes = True

class FocusSettingsBase(BaseModel):
    default_focus_duration: int = Field(25, ge=1, le=180, description="Default focus duration in minutes")
    default_short_break: int = Field(5, ge=1, le=60, description="Default short break duration in minutes")
    default_long_break: int = Field(15, ge=1, le=60, description="Default long break duration in minutes")
    sessions_until_long_break: int = Field(4, ge=1, le=10, description="Number of sessions until long break")
    auto_start_breaks: bool = Field(False, description="Auto start break sessions")
    auto_start_focus: bool = Field(False, description="Auto start focus sessions")
    sound_enabled: bool = Field(True, description="Enable sound notifications")

class FocusSettingsCreate(FocusSettingsBase):
    pass

class FocusSettingsUpdate(BaseModel):
    default_focus_duration: Optional[int] = Field(None, ge=1, le=180)
    default_short_break: Optional[int] = Field(None, ge=1, le=60)
    default_long_break: Optional[int] = Field(None, ge=1, le=60)
    sessions_until_long_break: Optional[int] = Field(None, ge=1, le=10)
    auto_start_breaks: Optional[bool] = None
    auto_start_focus: Optional[bool] = None
    sound_enabled: Optional[bool] = None

class FocusSettingsResponse(FocusSettingsBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

class FocusStatsResponse(BaseModel):
    total_sessions: int
    total_focus_time: int  # in minutes
    completed_sessions: int
    current_streak: int
    today_sessions: int
    today_focus_time: int
    weekly_sessions: int
    weekly_focus_time: int

class CompleteSessionRequest(BaseModel):
    actual_duration_minutes: int = Field(..., ge=0, le=180, description="Actual session duration in minutes") 