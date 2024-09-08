---
'@secustor/backstage-plugin-renovate-backend': minor
'@secustor/backstage-plugin-renovate-client': minor
'@secustor/backstage-plugin-renovate': minor
---

Breaking Change to the new Dependencies API!
The dependencies' endpoint does no longer return an array but rather an object with the field `dependencies`.
This is to allow adding other data such as available filter options