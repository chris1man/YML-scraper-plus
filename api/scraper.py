import os
import sys

# Add current directory to path for imports
sys.path.append('.')

from scraper import run_scraper

def handler(event, context):
    """
    Vercel serverless function handler for running the scraper
    """
    try:
        # Run the scraper and get YML content
        yml_content = run_scraper()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/xml; charset=utf-8',
                'Content-Disposition': 'attachment; filename="feed.yml"',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
            },
            'body': yml_content
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'text/plain; charset=utf-8',
                'Access-Control-Allow-Origin': '*'
            },
            'body': f'Error running scraper: {str(e)}'
        }