# Twitter 

A web application that scrapes trending topics from Twitter, stores the data in MongoDB, and displays it via a simple client interface.

## Tech Stack
1. Server: Node.js, Express.js, Selenium WebDriver, MongoDB
2. Client: HTML, CSS 

### Installation

1. Install server dependencies:
   ```sh
   cd backend
   npm install
   ```

2. Set up environment variables:
   Create a `.env` file in the `server` directory with the following content:
   ```env
   TWITTER_USERNAME="your_twitter_username"
   TWITTER_EMAIL="your_twitter_email"
   TWITTER_PASSWORD="your_twitter_password"
   MONGODB_URI="your_mongodb_uri"
   ```

### Running the Application

1. Start the  server:
   ```sh
   npm run scrape
   ```

2. Open `cleint/index.html` in a web browser.

## Usage

1. Open the client in a browser and click the "Click here to run the script" button to start scraping trending topics.
2. Displayed data will include trending topics, the IP address used, and MongoDB results.
