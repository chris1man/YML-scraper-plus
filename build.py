import os
import sys

sys.path.append('.')

from scraper import run_scraper

if __name__ == '__main__':
    print("Running scraper during build...")
    try:
        yml_content = run_scraper()
        with open('feed.yml', 'w', encoding='utf-8-sig') as f:
            f.write(yml_content)
        print(f"Scraper completed. feed.yml created with {len(yml_content)} bytes.")
    except Exception as e:
        print(f"Error running scraper: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
