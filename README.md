# Community Event Tracker

## Project Overview
Community Event Tracker is a web-based platform designed to help students and community members discover, track, and manage events effectively. The platform provides real-time updates, personalized notifications, and an interactive event dashboard to improve event accessibility and engagement.

## Features
- Event creation & management
- RSVP system for attendees
- Real-time notifications
- Search & filtering functionality
- User authentication & role-based access
- Interactive event dashboard

## Tech Stack
### **Frontend:**
- HTML, CSS, React.js

### **Backend:**
- JavaScript (Node.js/Express.js)

### **Database:**
- MySQL

### **Hosting & Version Control:**
- GitHub

## Project Structure
```plaintext
Community-Event-Tracker/
│── frontend/         # React.js frontend
│── backend/         # Node.js/Express backend
│── database/        # Database schemas & scripts
│── docs/            # Documentation & reports
│── README.md        # Project documentation
│── package.json     # Dependencies & scripts
│── .gitignore       # Files to ignore in Git
```

## Installation & Setup
### **Prerequisites:**
Ensure you have the following installed:
- Node.js & npm
- MySQL
- Git

### **Steps to Run the Project Locally:**
1. **Clone the repository:**
   ```sh
   git clone https://github.com/YinkaAjao/Community-Event-Tracker.git
   ```
2. **Navigate to the backend folder and install dependencies:**
   ```sh
   cd backend
   npm install
   ```
3. **Set up the database:**
   - Configure `.env` file with your MySQL credentials.
   - Run database migrations.
   
4. **Start the backend server:**
   ```sh
   npm start
   ```
5. **Navigate to the frontend folder and install dependencies:**
   ```sh
   cd ../frontend
   npm install
   ```
6. **Start the frontend application:**
   ```sh
   npm start
   ```
7. **Access the application:**
   Open `http://localhost:3000` in your browser.

## Database Design
- **Tables:** Users, Events, RSVPs, Notifications
- **Relationships:**
  - A **user** can create multiple **events**.
  - A **user** can RSVP to multiple **events**.
  - **Events** can send **notifications** to users.
- **Indexing Strategies:**
  - Indexed event titles & descriptions for faster search.
  - Optimized queries using relational indexing in MySQL.

## Screenshots & Resources
- **Figma Designs:** [View Designs](#)
- **Database Schema:** [View ERD](#)
- **GitHub Repository:** [Community Event Tracker](https://github.com/YinkaAjao/Community-Event-Tracker)

## Team Collaboration & Project Management
- **Tools Used:** GitHub, Slack, Jira, Google Drive
- **Development Workflow:** Agile methodology with daily standups and sprint planning.
- **Meetings & Discussions:** See `docs/` folder for meeting notes and progress reports.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
### **Contact & Support**
For any issues or contributions, please create an issue on GitHub or reach out to the development team.
