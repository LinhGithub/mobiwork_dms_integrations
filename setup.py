from setuptools import setup, find_packages

with open("requirements.txt") as f:
	install_requires = f.read().strip().split("\n")

# get version from __version__ variable in mobiwork_dms_integrations/__init__.py
from mobiwork_dms_integrations import __version__ as version

setup(
	name="mobiwork_dms_integrations",
	version=version,
	description="Xây dựng một app tích hợp mobiwork.DMS",
	author="LinhFrappe",
	author_email="lamthatnhanh111@gmail.com",
	packages=find_packages(),
	zip_safe=False,
	include_package_data=True,
	install_requires=install_requires
)
