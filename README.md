# GiRe Web

GiRe Web is a Next.js application designed to track and visualize your GitHub activity. It provides a dashboard and analytics to help you monitor your pull requests, issues, and overall contributions.

## Features

- **Dashboard:** Overview of your daily and weekly GitHub activity.
- **Analytics:** Detailed charts and metrics on your code contributions, including code churn, merged PRs, and review requests.
- **GitHub Sync:** Synchronize your data from GitHub to keep your local dashboard up-to-date.
- **Authentication:** Secure login and registration system.

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- MongoDB (running locally or a cloud instance)

### Installation

1.  Clone the repository:

    ```bash
    git clone https://github.com/yourusername/gire_web.git
    cd gire_web
    ```

2.  Install dependencies:

    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

3.  Set up environment variables:
    Create a `.env.local` file in the root directory and add the following variables:

    ```env
    # MongoDB Connection String
    MONGODB_URI=mongodb://127.0.0.1:27017/gireWeb

    # JWT Secret for Authentication
    JWT_SECRET=your_super_secret_jwt_key
    ```

4.  Run the development server:

    ```bash
    npm run dev
    # or
    yarn dev
    # or
    pnpm dev
    ```

5.  Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Usage

1.  **Register:** Create a new account.
2.  **Add Integration:** Go to the Dashboard, scroll to "Integrations", click "Add New", and enter your GitHub username and a Personal Access Token (with `repo` scope).
3.  **Sync Data:** Click the "Sync Now" button to fetch your data from GitHub.
4.  **Explore:** View your Dashboard and Analytics pages.

## License

This project is licensed under the MIT License.

## Contribute & Donate

If you find this project useful and would like to contribute or support its development, please feel free to reach out!

- **Instagram:** [@nielnimation](https://www.instagram.com/nielnimation/)
- **LinkedIn:** [daniel-w-k](https://www.linkedin.com/in/daniel-w-k/)

We welcome clear bug reports, feature requests, and pull requests.
