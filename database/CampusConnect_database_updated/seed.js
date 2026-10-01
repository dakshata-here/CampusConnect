require("dotenv").config();
const mongoose = require("mongoose");

// ===============================
// IMPORT MODELS
// ===============================
const User = require("./models/User");
const Department = require("./models/Department");
const Club = require("./models/Club");
const ClubMembership = require("./models/ClubMembership");
const Venue = require("./models/Venue");
const Event = require("./models/Event");
const Approval = require("./models/Approval");
const EventRegistration = require("./models/EventRegistration");
const Certificate = require("./models/Certificate");
const EventFeedback = require("./models/EventFeedback");
const Reminder = require("./models/Reminder");
const AcademicEvent = require("./models/AcademicEvent");
const SystemSettings = require("./models/SystemSettings");
const AppNotification = require("./models/AppNotification");
const ClubLeadTask = require("./models/ClubLeadTask");
const ClubLeadMessage = require("./models/ClubLeadMessage");
const EventBroadcastEmail = require("./models/EventBroadcastEmail");
const EventHistory = require("./models/EventHistory");

// ===============================
// DATABASE CONNECTION
// ===============================
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "MONGODB_URI is missing. Please create a .env file."
  );
}

// Demo password hash.
// Replace with a real bcrypt hash when authentication is implemented.
const DEMO_PASSWORD_HASH =
  "DEMO_HASH_REPLACE_BEFORE_AUTH_TESTING";

// ===============================
// DEPARTMENTS
// ===============================
const departments = [
  "Computer Engineering",
  "Information Technology",
  "Electronics and Communication Engineering",
  "Electronics and Computer Engineering",
  "Data Science"
];

// ===============================
// STUDENTS
// ===============================
const students = [
  [
    "Aarav Patil",
    "aarav.patil@campusconnect.edu",
    "PRN001",
    "Computer Engineering",
    3,
    5
  ],
  [
    "Ananya Sharma",
    "ananya.sharma@campusconnect.edu",
    "PRN002",
    "Information Technology",
    2,
    4
  ],
  [
    "Rohan Kulkarni",
    "rohan.kulkarni@campusconnect.edu",
    "PRN003",
    "Electronics and Communication Engineering",
    3,
    5
  ],
  [
    "Sneha Joshi",
    "sneha.joshi@campusconnect.edu",
    "PRN004",
    "Electronics and Computer Engineering",
    2,
    4
  ],
  [
    "Aditya Deshmukh",
    "aditya.deshmukh@campusconnect.edu",
    "PRN005",
    "Data Science",
    4,
    7
  ],
  [
    "Isha Mehta",
    "isha.mehta@campusconnect.edu",
    "PRN006",
    "Computer Engineering",
    2,
    4
  ],
  [
    "Omkar Shinde",
    "omkar.shinde@campusconnect.edu",
    "PRN007",
    "Information Technology",
    3,
    5
  ],
  [
    "Kavya Nair",
    "kavya.nair@campusconnect.edu",
    "PRN008",
    "Data Science",
    3,
    5
  ]
];

// ===============================
// FACULTY
// ===============================
const faculty = [
  [
    "Dr. Meera Kulkarni",
    "meera.kulkarni@campusconnect.edu",
    "FAC001",
    "Computer Engineering"
  ],
  [
    "Prof. Rahul Desai",
    "rahul.desai@campusconnect.edu",
    "FAC002",
    "Information Technology"
  ],
  [
    "Prof. Neha Joshi",
    "neha.joshi@campusconnect.edu",
    "FAC003",
    "Data Science"
  ]
];

// ===============================
// CLUBS
// ===============================
const clubData = [
  [
    "NSS Club",
    "NSS",
    "Student-led community service and social responsibility activities.",
    "Data Science",
    "OTHER"
  ],
  [
    "Pictorial",
    "PICTORIAL",
    "Photography and visual creativity club.",
    "Electronics and Computer Engineering",
    "CULTURAL"
  ],
  [
    "ACM Club",
    "ACM",
    "Technical club focused on computing, programming, and emerging technologies.",
    "Computer Engineering",
    "TECHNICAL"
  ],
  [
    "CSI Club",
    "CSI",
    "Technical club focused on software, cybersecurity, and project-based learning.",
    "Information Technology",
    "TECHNICAL"
  ],
  [
    "IEEE Club",
    "IEEE",
    "Engineering and technology club focused on innovation and technical learning.",
    "Electronics and Communication Engineering",
    "TECHNICAL"
  ]
];

// ===============================
// CLUB MEMBERSHIPS
// ===============================
const membershipData = [
  ["NSS Club", "Aarav Patil", "LEAD"],
  ["NSS Club", "Prof. Neha Joshi", "LEAD"],
  ["NSS Club", "Isha Mehta", "MEMBER"],
  ["NSS Club", "Kavya Nair", "MEMBER"],

  ["Pictorial", "Sneha Joshi", "LEAD"],
  ["Pictorial", "Prof. Rahul Desai", "LEAD"],
  ["Pictorial", "Ananya Sharma", "MEMBER"],
  ["Pictorial", "Rohan Kulkarni", "MEMBER"],

  ["ACM Club", "Omkar Shinde", "LEAD"],
  ["ACM Club", "Dr. Meera Kulkarni", "LEAD"],
  ["ACM Club", "Aarav Patil", "MEMBER"],
  ["ACM Club", "Aditya Deshmukh", "MEMBER"],

  ["CSI Club", "Aditya Deshmukh", "LEAD"],
  ["CSI Club", "Prof. Rahul Desai", "LEAD"],
  ["CSI Club", "Isha Mehta", "MEMBER"],
  ["CSI Club", "Omkar Shinde", "MEMBER"],

  ["IEEE Club", "Rohan Kulkarni", "LEAD"],
  ["IEEE Club", "Dr. Meera Kulkarni", "LEAD"],
  ["IEEE Club", "Ananya Sharma", "MEMBER"],
  ["IEEE Club", "Kavya Nair", "MEMBER"]
];

// ===============================
// VENUES
// ===============================
const venueData = [
  [
    "EnTC Seminar Hall",
    "EnTC Building",
    "1",
    150,
    ["Projector", "Audio System", "AC"]
  ],
  [
    "GCR (A3-001)",
    "A3 Building",
    "Ground",
    120,
    ["Projector", "Audio System", "Seating"]
  ],
  [
    "EDC",
    "Main Building",
    "Ground",
    100,
    ["Projector", "Audio System", "AC"]
  ],
  [
    "ACR C-402",
    "C Building",
    "4",
    80,
    ["Projector", "Wi-Fi", "Seating"]
  ],
  [
    "Shamiyana",
    "Open Ground",
    "Ground",
    300,
    ["Stage", "Audio System", "Lighting"]
  ],
  [
    "Auditorium",
    "Main Building",
    "Ground",
    500,
    ["Projector", "Stage", "Audio System", "AC"]
  ],
  [
    "Innovation Lab",
    "Innovation Building",
    "2",
    60,
    ["Computers", "Projector", "Wi-Fi"]
  ],
  [
    "Computer Lab 101",
    "Computer Building",
    "1",
    70,
    ["Computers", "Projector", "Wi-Fi"]
  ],
  [
    "Conference Room",
    "Admin Building",
    "2",
    40,
    ["Projector", "AC", "Wi-Fi"]
  ],
  [
    "Open Amphitheatre",
    "Campus Grounds",
    "Ground",
    250,
    ["Stage", "Audio System", "Lighting"]
  ]
];

// ===============================
// EVENT DESCRIPTIONS
// ===============================
const descriptions = {
  "CodeSprint 2026":
    "A competitive programming event focused on problem-solving, algorithms, and coding challenges.",

  "AI & Machine Learning Workshop":
    "An introductory workshop covering fundamental concepts and practical applications of AI and machine learning.",

  "ACM Coding Challenge":
    "A timed programming challenge designed to test logical thinking and algorithmic problem-solving.",

  "Web Development Bootcamp":
    "A hands-on learning session covering the fundamentals of modern web development.",

  "Tech Talk: Future of Computing":
    "A session discussing emerging trends and developments in computing.",

  "CSI Tech Symposium":
    "A technical gathering featuring discussions and presentations on current technology trends.",

  "Debugging Masterclass":
    "A practical session focused on identifying, analyzing, and resolving common software errors.",

  "Cyber Security Awareness Workshop":
    "An awareness program covering cybersecurity practices, online safety, and common digital threats.",

  "Project Expo: Innovate & Inspire":
    "A project exhibition where students present technical projects and innovative ideas.",

  "IEEE Innovation Meetup":
    "A technical interaction session focused on innovation, engineering ideas, and emerging technologies.",

  "Robotics & IoT Workshop":
    "A practical workshop introducing robotics concepts and Internet of Things applications.",

  "IEEE Paper Presentation":
    "A presentation event where students showcase technical research and innovative ideas.",

  "Future Technologies Seminar":
    "A seminar exploring emerging technologies and their potential applications.",

  "Photography Walk: Campus Through Our Lens":
    "A photography activity encouraging participants to capture creative views of the campus.",

  "Portrait Photography Workshop":
    "A workshop covering portrait composition, lighting, framing, and photography techniques.",

  "FrameFest Photography Competition":
    "A photography competition where participants showcase their creative photographic work.",

  "Creative Editing Masterclass":
    "A practical session introducing digital photo editing and creative post-processing techniques.",

  "NSS Community Service Drive":
    "A community-oriented activity encouraging students to participate in social service initiatives.",

  "Blood Donation Awareness Camp":
    "An awareness program promoting knowledge about blood donation and its social importance.",

  "Clean Campus Campaign":
    "A campus cleanliness and environmental awareness activity involving student volunteers.",

  "NSS Volunteer Orientation":
    "An orientation session introducing volunteers to NSS activities, responsibilities, and upcoming initiatives.",

  "Community Outreach & Social Responsibility Talk":
    "A session focused on community engagement and student participation in social responsibility activities."
};

// ===============================
// 22 CLUB EVENTS
// ===============================
const eventData = [
  ["CodeSprint 2026","COMPETITION","ACM Club","Computer Lab 101","2026-10-05","09:00","13:00","Omkar Shinde",60,"2026-10-03","APPROVED"],

  ["AI & Machine Learning Workshop","WORKSHOP","ACM Club","EnTC Seminar Hall","2026-10-09","10:00","13:00","Dr. Meera Kulkarni",120,"2026-10-07","APPROVED"],

  ["ACM Coding Challenge","COMPETITION","ACM Club","Innovation Lab","2026-10-17","10:00","15:00","Omkar Shinde",50,"2026-10-15","PENDING_APPROVAL"],

  ["Web Development Bootcamp","WORKSHOP","ACM Club","Computer Lab 101","2026-10-24","09:30","16:00","Dr. Meera Kulkarni",70,"2026-10-22","APPROVED"],

  ["Tech Talk: Future of Computing","SEMINAR","ACM Club","GCR (A3-001)","2026-11-06","14:00","16:00","Omkar Shinde",100,"2026-11-04","APPROVED"],

  ["CSI Tech Symposium","SYMPOSIUM","CSI Club","GCR (A3-001)","2026-10-08","10:00","14:00","Aditya Deshmukh",120,"2026-10-06","APPROVED"],

  ["Debugging Masterclass","WORKSHOP","CSI Club","ACR C-402","2026-10-16","11:00","13:00","Prof. Rahul Desai",70,"2026-10-14","PENDING_APPROVAL"],

  ["Cyber Security Awareness Workshop","WORKSHOP","CSI Club","EnTC Seminar Hall","2026-10-29","10:00","13:00","Aditya Deshmukh",140,"2026-10-27","APPROVED"],

  ["Project Expo: Innovate & Inspire","EXHIBITION","CSI Club","Auditorium","2026-11-14","10:00","16:00","Prof. Rahul Desai",300,"2026-11-12","APPROVED"],

  ["IEEE Innovation Meetup","MEETUP","IEEE Club","EDC","2026-10-12","10:00","13:00","Rohan Kulkarni",90,"2026-10-10","APPROVED"],

  ["Robotics & IoT Workshop","WORKSHOP","IEEE Club","Innovation Lab","2026-10-21","09:30","14:00","Dr. Meera Kulkarni",60,"2026-10-19","APPROVED"],

  ["IEEE Paper Presentation","PAPER_PRESENTATION","IEEE Club","GCR (A3-001)","2026-10-30","10:00","15:00","Rohan Kulkarni",100,"2026-10-28","PENDING_APPROVAL"],

  ["Future Technologies Seminar","SEMINAR","IEEE Club","EnTC Seminar Hall","2026-11-12","14:00","16:30","Dr. Meera Kulkarni",140,"2026-11-10","APPROVED"],

  ["Photography Walk: Campus Through Our Lens","ACTIVITY","Pictorial","Open Amphitheatre","2026-10-07","08:00","11:00","Sneha Joshi",40,"2026-10-05","APPROVED"],

  ["Portrait Photography Workshop","WORKSHOP","Pictorial","ACR C-402","2026-10-15","10:00","13:00","Prof. Rahul Desai",60,"2026-10-13","APPROVED"],

  ["FrameFest Photography Competition","COMPETITION","Pictorial","Shamiyana","2026-10-28","10:00","16:00","Sneha Joshi",150,"2026-10-25","APPROVED"],

  ["Creative Editing Masterclass","WORKSHOP","Pictorial","GCR (A3-001)","2026-11-05","11:00","14:00","Prof. Rahul Desai",100,"2026-11-02","CHANGES_REQUESTED"],

  ["NSS Community Service Drive","COMMUNITY_SERVICE","NSS Club","Shamiyana","2026-10-11","08:00","13:00","Aarav Patil",200,"2026-10-08","APPROVED"],

  ["Blood Donation Awareness Camp","AWARENESS","NSS Club","EDC","2026-10-19","09:00","15:00","Prof. Neha Joshi",100,"2026-10-16","APPROVED"],

  ["Clean Campus Campaign","ACTIVITY","NSS Club","Open Amphitheatre","2026-11-02","08:00","12:00","Aarav Patil",150,null,"APPROVED"],

  ["NSS Volunteer Orientation","ORIENTATION","NSS Club","GCR (A3-001)","2026-11-09","14:00","16:00","Prof. Neha Joshi",100,"2026-11-07","PENDING_APPROVAL"],

  ["Community Outreach & Social Responsibility Talk","TALK","NSS Club","Auditorium","2026-11-20","10:00","13:00","Aarav Patil",250,"2026-11-18","APPROVED"]
];

// ===============================
// ACADEMIC EVENTS
// ===============================
const academicData = [
  ["Mid-Semester Examination Schedule","EXAM",null,"2026-10-12","2026-10-24","HIGH"],

  ["End-Semester Examination Schedule","EXAM",null,"2026-12-01","2026-12-15","HIGH"],

  ["Mid-Semester Examination Form Submission","DEADLINE",null,"2026-10-05","2026-10-05","HIGH"],

  ["End-Semester Examination Form Submission","DEADLINE",null,"2026-11-10","2026-11-10","HIGH"],

  ["Diwali Vacation","HOLIDAY",null,"2026-11-09","2026-11-13","NORMAL"],

  ["Academic Fee Payment Deadline","DEADLINE",null,"2026-10-20","2026-10-20","HIGH"],

  ["Internal Assessment Submission Notice","NOTICE",null,"2026-10-06","2026-10-06","NORMAL"],

  ["Semester Project Submission Deadline","DEADLINE",null,"2026-11-20","2026-11-20","HIGH"],

  ["Student Attendance Review Notice","NOTICE",null,"2026-10-26","2026-10-26","NORMAL"],

  ["Technical Elective Registration","DEADLINE",null,"2026-10-30","2026-10-30","NORMAL"],

  ["Computer Engineering Department Seminar Notice","NOTICE","Computer Engineering","2026-11-03","2026-11-03","NORMAL"],

  ["Information Technology Project Review","NOTICE","Information Technology","2026-11-05","2026-11-05","HIGH"],

  ["EnTC Mini Project Review Schedule","NOTICE","Electronics and Communication Engineering","2026-11-06","2026-11-06","HIGH"],

  ["Electronics and Computer Engineering Project Review","NOTICE","Electronics and Computer Engineering","2026-11-07","2026-11-07","HIGH"],

  ["Data Science Project Review","NOTICE","Data Science","2026-11-09","2026-11-09","HIGH"],

  ["Revised Academic Calendar Circular","CIRCULAR",null,"2026-10-02","2026-10-02","HIGH"],

  ["Library Book Return Notice","NOTICE",null,"2026-11-25","2026-11-25","NORMAL"],

  ["Semester Registration Circular","CIRCULAR",null,"2026-11-18","2026-11-18","HIGH"],

  ["Constitution Day Holiday","HOLIDAY",null,"2026-11-26","2026-11-26","NORMAL"],

  ["Examination Hall Ticket Collection","NOTICE",null,"2026-11-25","2026-11-27","URGENT"]
];

// ===============================
// MAIN SEED FUNCTION
// ===============================
async function seedDatabase() {

  await mongoose.connect(MONGODB_URI);

  console.log("MongoDB connected.");

  // WARNING:
  // This deletes existing data in these collections.
  // Use only for your test/demo database.
  await Promise.all([
    User.deleteMany({}),
    Department.deleteMany({}),
    Club.deleteMany({}),
    ClubMembership.deleteMany({}),
    Venue.deleteMany({}),
    Event.deleteMany({}),
    Approval.deleteMany({}),
    EventRegistration.deleteMany({}),
    Certificate.deleteMany({}),
    EventFeedback.deleteMany({}),
    Reminder.deleteMany({}),
    AcademicEvent.deleteMany({}),
    SystemSettings.deleteMany({}),
    AppNotification.deleteMany({}),
    ClubLeadTask.deleteMany({}),
    ClubLeadMessage.deleteMany({}),
    EventBroadcastEmail.deleteMany({}),
    EventHistory.deleteMany({})
  ]);

  console.log("Old demo data cleared.");

  // ===============================
  // DEPARTMENTS
  // ===============================
  const departmentDocs =
    await Department.insertMany(
      departments.map(name => ({ name }))
    );

  const department = Object.fromEntries(
    departmentDocs.map(d => [d.name, d._id])
  );

  // ===============================
  // USERS
  // ===============================
  const userData = [];

  students.forEach(
    ([fullName, email, prn, departmentName, year, semester]) => {

      userData.push({
        fullName,
        email,
        prn,
        userType: "STUDENT",
        departmentId: department[departmentName],
        year,
        semester,
        passwordHash: DEMO_PASSWORD_HASH,
        isActive: true
      });

    }
  );

  faculty.forEach(
    ([fullName, email, employeeId, departmentName]) => {

      userData.push({
        fullName,
        email,
        employeeId,
        userType: "FACULTY",
        departmentId: department[departmentName],
        passwordHash: DEMO_PASSWORD_HASH,
        isActive: true
      });

    }
  );

  // ADMIN
  userData.push({
    fullName: "Admin User",
    email: "admin@campusconnect.edu",
    employeeId: "ADM001",
    userType: "ADMIN",
    passwordHash: DEMO_PASSWORD_HASH,
    isActive: true
  });

  const userDocs =
    await User.insertMany(userData);

  const user = Object.fromEntries(
    userDocs.map(u => [u.fullName, u])
  );

  const admin = user["Admin User"];

  console.log(`Users inserted: ${userDocs.length}`);

  // ===============================
  // CLUBS
  // ===============================
  const clubDocs =
    await Club.insertMany(
      clubData.map(
        ([name, shortName, description, departmentName, category]) => ({
          name,
          shortName,
          description,
          departmentId: department[departmentName],
          category,
          status: "ACTIVE"
        })
      )
    );

  const club = Object.fromEntries(
    clubDocs.map(c => [c.name, c])
  );

  console.log(`Clubs inserted: ${clubDocs.length}`);

  // ===============================
  // CLUB MEMBERSHIPS
  // ===============================
  await ClubMembership.insertMany(
    membershipData.map(
      ([clubName, userName, role]) => ({
        clubId: club[clubName]._id,
        userId: user[userName]._id,
        role,
        isActive: true
      })
    )
  );

  console.log(
    `Memberships inserted: ${membershipData.length}`
  );

  // ===============================
  // VENUES
  // ===============================
  const venueDocs =
    await Venue.insertMany(
      venueData.map(
        ([name, building, floor, capacity, facilities]) => ({
          name,
          building,
          floor,
          capacity,
          facilities,
          isAvailable: true,
          operationalStatus: "OPERATIONAL"
        })
      )
    );

  const venue = Object.fromEntries(
    venueDocs.map(v => [v.name, v])
  );

  console.log(`Venues inserted: ${venueDocs.length}`);

  // ===============================
  // CLUB EVENTS
  // ===============================
  const eventDocs =
    await Event.insertMany(
      eventData.map(
        ([
          title,
          eventType,
          clubName,
          venueName,
          date,
          startTime,
          endTime,
          proposer,
          maxParticipants,
          deadline,
          status
        ]) => ({

          title,

          eventType,

          category: "CLUB",

          shortDescription:
            descriptions[title],

          description:
            descriptions[title],

          agenda:
            "Introduction, main session, interactive activity, Q&A, and closing.",

          date: new Date(date),

          startTime,

          endTime,

          venueId:
            venue[venueName]._id,

          clubId:
            club[clubName]._id,

          proposedBy:
            user[proposer]._id,

          maxParticipants,

          registrationRequired:
            deadline !== null,

          registrationMethod:
            deadline !== null
              ? "CAMPUSCONNECT"
              : "NONE",

          registrationDeadline:
            deadline
              ? new Date(`${deadline}T23:59:00`)
              : null,

          eligibility:
            "Open to eligible undergraduate students.",

          requiredMaterials:
            eventType === "COMPETITION"
              ? "Laptop and college ID."
              : "College ID; laptop recommended where applicable.",

          contactPerson:
            proposer,

          contactEmail:
            user[proposer].email,

          status,

          posterTheme:
            "CampusConnect Demo Event"

        })
      )
    );

  console.log(
    `Club events inserted: ${eventDocs.length}`
  );

  // ===============================
  // APPROVALS + HISTORY
  // ===============================
  const approvals = [];
  const histories = [];

  eventDocs.forEach(event => {

    if (event.status === "APPROVED") {

      approvals.push({
        eventId: event._id,
        reviewedBy: admin._id,
        action: "APPROVED",
        comments: "Approved for publication.",
        reviewedAt: new Date()
      });

      histories.push({
        eventId: event._id,
        changedBy: admin._id,
        action: "APPROVED",
        previousStatus: "PENDING_APPROVAL",
        newStatus: "APPROVED",
        comments: "Approved for publication."
      });

    }

    else if (
      event.status === "CHANGES_REQUESTED"
    ) {

      approvals.push({
        eventId: event._id,
        reviewedBy: admin._id,
        action: "CHANGES_REQUESTED",
        comments:
          "Please provide clearer workshop agenda and participation details.",
        reviewedAt: new Date()
      });

      histories.push({
        eventId: event._id,
        changedBy: admin._id,
        action: "CHANGES_REQUESTED",
        previousStatus: "PENDING_APPROVAL",
        newStatus: "CHANGES_REQUESTED",
        comments:
          "Please provide clearer workshop agenda and participation details."
      });

    }

    else {

      histories.push({
        eventId: event._id,
        changedBy: event.proposedBy,
        action: "SUBMITTED",
        previousStatus: "DRAFT",
        newStatus: "PENDING_APPROVAL",
        comments:
          "Event submitted for administrative review."
      });

    }

  });

  if (approvals.length) {
    await Approval.insertMany(approvals);
  }

  if (histories.length) {
    await EventHistory.insertMany(histories);
  }

  console.log("Approval and event history data inserted.");

  // ===============================
  // ACADEMIC EVENTS
  // ===============================
  const academicDescriptions = {

    EXAM:
      "Academic examination schedule and instructions.",

    DEADLINE:
      "Academic deadline and submission instructions.",

    HOLIDAY:
      "Academic holiday period.",

    NOTICE:
      "Important academic notice for students.",

    CIRCULAR:
      "Official academic circular for students and faculty."

  };

  await AcademicEvent.insertMany(

    academicData.map(
      ([
        title,
        type,
        departmentName,
        date,
        endDate,
        priority
      ]) => ({

        title,

        type,

        description:
          academicDescriptions[type],

        departmentId:
          departmentName
            ? department[departmentName]
            : undefined,

        date:
          new Date(date),

        endDate:
          new Date(`${endDate}T23:59:00`),

        priority,

        isUrgent:
          priority === "URGENT",

        showInCalendar:
          true,

        isPublished:
          true

      })
    )

  );

  console.log(
    `Academic events inserted: ${academicData.length}`
  );

  // ===============================
  // EVENT REGISTRATIONS
  // ===============================
  const studentsOnly =
    userDocs.filter(
      u => u.userType === "STUDENT"
    );

  const approvedEvents =
    eventDocs.filter(
      e =>
        e.registrationRequired &&
        e.status === "APPROVED"
    );

  const registrationData = [];

  approvedEvents.forEach(
    (event, eventIndex) => {

      for (let i = 0; i < 3; i++) {

        const student =
          studentsOnly[
            (eventIndex + i) %
            studentsOnly.length
          ];

        registrationData.push({

          eventId:
            event._id,

          studentId:
            student._id,

          studentEnrollment:
            student.prn,

          teamName:
            event.title.includes("Challenge") ||
            event.title.includes("CodeSprint")
              ? `Team-${eventIndex + 1}-${i + 1}`
              : undefined,

          registrationDate:
            new Date("2026-09-20T10:00:00"),

          attendanceStatus:
            "REGISTERED"

        });

      }

    }
  );

  const registrationDocs =
    await EventRegistration.insertMany(
      registrationData
    );

  console.log(
    `Registrations inserted: ${registrationDocs.length}`
  );

  // ===============================
  // FEEDBACK
  // ===============================
  const feedbackData =
    registrationDocs
      .slice(0, 8)
      .map((registration, index) => ({

        eventId:
          registration.eventId,

        studentId:
          registration.studentId,

        rating:
          4 + (index % 2),

        usefulnessRating:
          4 + (index % 2),

        organizationRating:
          4,

        comments:
          "The event was informative and well organized.",

        suggestions:
          "Include more interactive activities in future sessions."

      }));

  if (feedbackData.length) {
    await EventFeedback.insertMany(
      feedbackData
    );
  }

  // ===============================
  // REMINDERS
  // ===============================
  await Reminder.insertMany(

    registrationDocs
      .slice(0, 12)
      .map(registration => ({

        userId:
          registration.studentId,

        eventId:
          registration.eventId,

        reminderType:
          "1_DAY",

        scheduledFor:
          new Date("2026-10-01T10:00:00"),

        isSent:
          false

      }))

  );

  // ===============================
  // NOTIFICATIONS
  // ===============================
  const notificationEvents =
    eventDocs.filter(
      event =>
        event.status === "APPROVED" ||
        event.status === "CHANGES_REQUESTED"
    );

  await AppNotification.insertMany(

    notificationEvents
      .slice(0, 12)
      .map(event => ({

        userId:
          event.proposedBy,

        userRole:
          "CLUB_LEAD",

        title:
          event.status === "APPROVED"
            ? "Event Approved"
            : "Changes Requested",

        message:
          event.status === "APPROVED"
            ? `${event.title} has been approved.`
            : `Changes are requested for ${event.title}.`,

        type:
          event.status === "APPROVED"
            ? "EVENT_APPROVAL"
            : "EVENT_UPDATE",

        eventId:
          event._id,

        isRead:
          false

      }))

  );

  // ===============================
  // CLUB LEAD TASKS
  // ===============================
  await ClubLeadTask.insertMany([

    {
      clubId:
        club["ACM Club"]._id,

      createdBy:
        user["Omkar Shinde"]._id,

      assignedTo:
        user["Omkar Shinde"]._id,

      title:
        "Finalize CodeSprint registrations",

      description:
        "Review registrations and prepare the participant list.",

      priority:
        "HIGH",

      dueDate:
        new Date("2026-10-04"),

      status:
        "IN_PROGRESS"
    },

    {
      clubId:
        club["NSS Club"]._id,

      createdBy:
        user["Aarav Patil"]._id,

      assignedTo:
        user["Aarav Patil"]._id,

      title:
        "Prepare community service volunteers",

      description:
        "Finalize volunteer allocation for the service drive.",

      priority:
        "MEDIUM",

      dueDate:
        new Date("2026-10-08"),

      status:
        "TODO"
    }

  ]);

  // ===============================
  // CLUB LEAD MESSAGES
  // ===============================
  await ClubLeadMessage.insertMany([

    {
      clubId:
        club["ACM Club"]._id,

      senderId:
        user["Omkar Shinde"]._id,

      message:
        "Please review the CodeSprint participant list before the event."
    },

    {
      clubId:
        club["NSS Club"]._id,

      senderId:
        user["Prof. Neha Joshi"]._id,

      message:
        "Volunteer orientation details have been shared with the NSS team."
    }

  ]);

  // ===============================
  // EVENT BROADCAST EMAILS
  // ===============================
  const broadcastEvents =
    eventDocs
      .filter(
        event => event.status === "APPROVED"
      )
      .slice(0, 5);

  await EventBroadcastEmail.insertMany(

    broadcastEvents.map(event => ({

      eventId:
        event._id,

      sentBy:
        event.proposedBy,

      subject:
        `CampusConnect: ${event.title}`,

      message:
        `Registration and event details for ${event.title} are available on CampusConnect.`,

      recipientCount:
        studentsOnly.length,

      recipientUserIds:
        studentsOnly.map(
          student => student._id
        ),

      sentAt:
        new Date()

    }))

  );

  // ===============================
  // SYSTEM SETTINGS
  // ===============================
  await SystemSettings.create({

    academicYear:
      "2026-27",

    semester:
      5,

    termCommencementDate:
      new Date("2026-08-01"),

    termConclusionDate:
      new Date("2026-12-31"),

    examinationWindowStart:
      new Date("2026-12-01"),

    examinationWindowEnd:
      new Date("2026-12-15"),

    proposalPermissions: {

      clubLeadsCanPropose:
        true,

      requireAdminApproval:
        true

    },

    maintenanceMode:
      false,

    notificationSettings: {

      approvals:
        true,

      eventUpdates:
        true,

      reminders:
        true

    }

  });

  // ===============================
  // CERTIFICATES
  // ===============================
  // Demo certificates are intentionally
  // not generated because registrations
  // are currently REGISTERED rather than ATTENDED.
  //
  // Certificates should be created after
  // attendance is marked ATTENDED.

  console.log("");
  console.log("======================================");
  console.log("CampusConnect seed completed!");
  console.log("======================================");
  console.log(`Departments : ${departmentDocs.length}`);
  console.log(`Users       : ${userDocs.length}`);
  console.log(`Clubs       : ${clubDocs.length}`);
  console.log(`Memberships  : ${membershipData.length}`);
  console.log(`Venues      : ${venueDocs.length}`);
  console.log(`Club Events  : ${eventDocs.length}`);
  console.log(`Academic Events : ${academicData.length}`);
  console.log(`Registrations  : ${registrationDocs.length}`);
  console.log(`Feedback      : ${feedbackData.length}`);
  console.log("======================================");

  await mongoose.disconnect();
}

// ===============================
// RUN
// ===============================
seedDatabase()

  .then(() => {
    console.log("MongoDB connection closed.");
  })

  .catch(async error => {

    console.error(
      "Seed failed:",
      error
    );

    await mongoose
      .disconnect()
      .catch(() => {});

    process.exit(1);
  });
