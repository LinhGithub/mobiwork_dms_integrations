## Mobiwork DMS Intergration

Xây dựng một app tích hợp mobiwork.DMS

## Required

Install frappe-bench version 14

- bench init <bench_name> --frappe-branch version-14

Install ERPNext version 14 in bench & site

- bench get-app erpnext --branch version-14
- bench --site <site_name> install-app erpnext

Install app Mobiwork DMS Intergration

- bench get-app <app_name> https://github.com/LinhGithub/mobiwork_dms_integrations.git
- bench --site <site_name> install-app <app_name>

#### License

MIT
