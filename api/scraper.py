import os
import sys
from flask import Flask, Response

# Add current directory to path for imports
sys.path.append('.')

from scraper import run_scraper

app = Flask(__name__)

@app.route('/api/scraper', methods=['GET'])
def handler():
    """
    Vercel Flask app for running the scraper
    """
    try:
        # Run the scraper and get YML content
        yml_content = run_scraper()

        return Response(
            yml_content,
            mimetype='application/xml; charset=utf-8',
            headers={'Content-Disposition': 'attachment; filename="feed.yml"'}
        )
    except Exception as e:
        return Response(
            f'Error running scraper: {str(e)}',
            status=500,
            mimetype='text/plain; charset=utf-8'
        )

# For Vercel
if __name__ == '__main__':
    app.run()