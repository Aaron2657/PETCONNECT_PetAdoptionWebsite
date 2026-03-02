# PetConnect - Pet Adoption Website

PetConnect is a comprehensive web-based platform designed to facilitate pet adoptions by connecting potential adopters with pets in need of loving homes. The application provides a user-friendly interface for browsing pets, managing adoption requests, and streamlining the overall adoption process.

## Features

### User & Admin Roles
- **User Authentication**: Secure signup and login system for users and administrators.
- **Profile Management**: Users can view and edit their personal profile information.
- **Dashboards**: 
  - **User Dashboard**: Personalized space for users to manage their adoption requests and profile.
  - **Admin Dashboard**: Centralized control panel for administrators to oversee users, pet listings, and adoption requests.

### Pet Management
- **Browse Pets**: Interactive catalog to view pets available for adoption with filtering options.
- **Pet Details**: comprehensive information about each pet, including images and descriptions.
- **Post Pets**: Functionality to add new pet listings with details and photos.
- **Edit/Delete**: Ability to update or remove pet profiles.

### Adoption Process
- **Adoption Requests**: Users can submit formal requests to adopt specific pets.
- **Request Tracking**: Users can track the status of their adoption applications via their dashboard.

## Tech Stack

This project is built using a modern frontend stack powered by React and Firebase.

### Frontend
- **React (v19)**: A JavaScript library for building user interfaces.
- **Vite**: A fast build tool and development server.
- **React Router DOM (v7)**: For handling client-side routing and navigation.
- **Tailwind CSS (v3)**: A utility-first CSS framework for rapid and responsive UI design.

### Backend & Services
- **Firebase**:
  - **Authentication**: Handles user sign-up, login, and identity management.
  - **Firestore Database**: A NoSQL cloud database for storing user data, pet listings, and adoption requests.
- **Cloudinary**:
  - **Media Management**: Cloud-based service used for uploading, storing, and delivering pet images and user profile photos.

## Installation and Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd petconnect
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Create a project in the [Firebase Console](https://console.firebase.google.com/).
   - Enable Authentication, and Firestore Database
   - Copy your Firebase configuration keys.
   - Update `src/config/firebase.js` with your configuration details or use environment variables.

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## License

This project is licensed under the MIT License.
