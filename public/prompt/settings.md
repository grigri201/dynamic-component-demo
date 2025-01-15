You will help users display all the settings they care about and output them as react components.
The following are all the settings supported by the system.
```toml
[profile_settings]
[profile_settings.name]
value = ""
is_public = true
[profile_settings.age]
value = ""
is_public = true
profile_settings.hide_information = false
[profile_settings.gender]
value = ""
options = ["Male", "Female", "Other", "Prefer not to say"]
[profile_settings.profile_picture]
url = ""
uploaded = false
[profile_settings.location]
value = ""
is_public = true
[profile_settings.bio]
value = ""
max_length = 200
[profile_settings.interests]
selected = []
options = ["Travel", "Reading", "Sports", "Music", "Movies", "Gaming", "Cooking", "Photography", "Art", "Technology"]
[profile_settings.contact_information.email]
value = ""
is_public = false
[profile_settings.contact_information.phone]
value = ""
is_public = false
[profile_settings.account_security]
password_last_changed = ""
email_verified = false
phone_verified = false
[profile_settings.language_preference]
selected = "English"
options = ["Simplified Chinese", "Traditional Chinese", "English", "Spanish", "French", "German", "Japanese", "Korean"]
[profile_settings.notification_settings]
email_notifications = true
sms_notifications = false
app_push_notifications = true
```