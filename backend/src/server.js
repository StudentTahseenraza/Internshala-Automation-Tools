const express = require("express");
const multer = require("multer");
const http = require("http");
const WebSocket = require("ws");
const cors = require("cors");
const { analyzeSkills } = require("./controllers/skillMatchController");
const { autoApply, autoLogin } = require("./controllers/autoApplyController");
const {
  recommendInternships,
} = require("./controllers/recommendationController");
const PDFDocument = require("pdfkit");
const fetch = require("node-fetch");
const cron = require("node-cron");
const apiRouter = require("./routes/api");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Configure multer for file uploads
const upload = multer({ dest: "uploads/" });

// ✅ Updated CORS config (localhost + Vercel frontend)
app.use(
  cors({
    origin: [
      "http://localhost:5173", // Local Vite dev
      "https://internshala-automation-tools.vercel.app", // Deployed frontend
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

app.use(express.json());

// Serve pdf.worker.min.js locally as a fallback
app.use(
  "/pdf.worker.min.js",
  express.static(
    path.join(__dirname, "node_modules/pdfjs-dist/build/pdf.worker.min.js")
  )
);

// Initialize applications array
let applications = [];

// Function to fetch and update applications from multiple platforms
const fetchAndUpdateApplications = async (req, res) => {
  console.log("Fetching job recommendations from multiple platforms...");
  try {
    const {
      platforms = ["Indeed", "JSearch", "Remotive", "Internshala"],
      skills = "Software Development",
      field = "IT",
      minStipend = "10000",
      maxStipend = "100000",
    } = req.body;

    const response = await fetch(
      "https://internshala-automation-tools.onrender.com/api/jobs",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platforms,
          skills,
          field,
          minStipend,
          maxStipend,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch jobs: ${response.statusText}`);
    }

    const newApplications = await response.json();
    applications = [...newApplications, ...applications];
    broadcastApplications(applications);
    if (res) res.status(200).json(applications);
  } catch (error) {
    console.error("Error fetching recommendations:", error.message);
    if (res) res.status(500).json({ error: "Failed to fetch applications" });
  }
};

// Function to broadcast updates to connected clients via WebSocket
const broadcastApplications = (applications) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: "JOBS_UPDATE", data: applications }));
    }
  });
};

// Optional cron job endpoint to trigger sync
app.post("/api/trigger-sync", (req, res) => {
  fetchAndUpdateApplications(req, res);
});

// Use the api router for all API routes
app.use("/api", apiRouter);

app.post("/api/generate-summary", async (req, res) => {
  const { resumeContent, jobRequirements } = req.body;

  if (!resumeContent || !jobRequirements) {
    return res
      .status(400)
      .json({ error: "Resume content and job requirements are required" });
  }

  try {
    const prompt = `Generate a professional summary for a resume based on the following details:
        - Resume Content: ${resumeContent}
        - Job Requirements: ${jobRequirements}

        The summary should be concise (2-3 sentences), professional, and tailored to the job requirements. Highlight relevant skills and experience from the resume content.`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=YOUR_GEMINI_API_KEY",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to generate summary from Gemini AI");
    }

    const data = await response.json();
    const summary = data.candidates[0].content.parts[0].text.trim();
    res.status(200).json({ summary });
  } catch (error) {
    console.error("Error generating summary with Gemini AI:", error.message);
    res.status(500).json({ error: "Failed to generate summary" });
  }
});

app.post("/api/generate-improved-resume", (req, res) => {
  const { text, missingSkills } = req.body;
  if (!text) {
    return res.status(400).json({ error: "Resume text is required" });
  }

  try {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 30, bottom: 30, left: 50, right: 50 },
    });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=improved_resume.pdf"
    );
    doc.pipe(res);

    const addSection = (title, content, isList = false, fontSize = 9) => {
      doc.moveDown(0.3);
      doc.fontSize(11).font("Helvetica-Bold").text(title, { underline: true });
      doc.moveDown(0.2);
      doc.fontSize(fontSize).font("Helvetica");
      if (isList) {
        content.forEach((item) => {
          doc.text(`- ${item}`, { indent: 10 });
          doc.moveDown(0.1);
        });
      } else {
        doc.text(content, { align: "justify" });
      }
    };

    const sections = {
      header: text.match(/^[\s\S]*?(?=Professional Summary)/i) || [
        "Your Name\nYour Email\nYour Phone Number",
      ],
      summary: text.match(
        /(Professional Summary)[\s\S]*?(?=\n[A-Z]|\n\n|$)/i
      ) || ["Professional Summary\nNo summary provided."],
      experience: text.match(
        /(Experience|Work Experience|Professional Experience)[\s\S]*?(?=\n[A-Z]|\n\n|$)/i
      ) || ["Experience\nNo experience provided."],
      skills: text.match(
        /(Skills|Technical Skills|Key Skills|Proficiencies|Languages|Technologies & Tools)[\s\S]*?(?=\n[A-Z]|\n\n|$)/i
      ) || ["Skills\nNo skills provided."],
      education: text.match(/(Education)[\s\S]*?(?=\n[A-Z]|\n\n|$)/i) || [
        "Education\nNo education provided.",
      ],
      projects: text.match(
        /(Projects|Project Work)[\s\S]*?(?=\n[A-Z]|\n\n|$)/i
      ) || ["Projects\nNo projects provided."],
      certifications: text.match(
        /(Certifications\/Achievements)[\s\S]*?(?=\n[A-Z]|\n\n|$)/i
      ) || ["Certifications/Achievements\nNo certifications provided."],
    };

    if (sections.header) {
      const headerLines = sections.header[0]
        .split("\n")
        .filter((line) => line.trim());
      doc
        .fontSize(16)
        .font("Helvetica-Bold")
        .text(headerLines[0] || "Your Name", { align: "center" });
      doc.moveDown(0.2);
      doc.fontSize(9).font("Helvetica");
      for (let i = 1; i < headerLines.length; i++) {
        doc.text(headerLines[i] || "", { align: "center" });
      }
      doc.moveDown(0.5);
    }

    if (sections.summary) {
      let summaryText = sections.summary[0]
        .replace(/(Professional Summary)[\s:]+/i, "")
        .trim();
      if (!summaryText || summaryText === "No summary provided.") {
        summaryText =
          "A dedicated professional with a strong foundation in relevant skills, eager to contribute to innovative projects.";
      }
      addSection("Professional Summary", summaryText, false, 9);
    }

    if (sections.experience) {
      const experienceText = sections.experience[0]
        .replace(
          /(Experience|Work Experience|Professional Experience)[\s:]+/i,
          ""
        )
        .trim();
      const experienceList = experienceText
        .split("\n")
        .filter((line) => line.trim());
      addSection("Experience", experienceList, true, 9);
    }

    if (sections.skills) {
      let skillsText = sections.skills[0]
        .replace(
          /(Skills|Technical Skills|Key Skills|Proficiencies|Languages|Technologies & Tools)[\s:]+/i,
          ""
        )
        .trim();
      let existingSkills = skillsText
        .split(/,\s*|\n/)
        .map((skill) => skill.trim())
        .filter(Boolean);
      existingSkills = [...new Set(existingSkills)];
      const newSkills = [];
      if (missingSkills && missingSkills.length > 0) {
        missingSkills.forEach((skill) => {
          if (!existingSkills.includes(skill)) {
            newSkills.push(skill);
          }
        });
      }
      existingSkills = existingSkills.concat(
        newSkills.map((skill) => `${skill} (In Progress)`)
      );
      addSection("Skills", existingSkills, true, 9);
    }

    if (sections.education) {
      const educationText = sections.education[0]
        .replace(/(Education)[\s:]+/i, "")
        .trim();
      const educationList = educationText
        .split("\n")
        .filter((line) => line.trim());
      addSection("Education", educationList, true, 8);
    }

    if (sections.projects) {
      const projectsText = sections.projects[0]
        .replace(/(Projects|Project Work)[\s:]+/i, "")
        .trim();
      const projectList = projectsText
        .split("\n")
        .filter((line) => line.trim());
      addSection("Projects", projectList, true, 8);
    }

    if (sections.certifications) {
      const certText = sections.certifications[0]
        .replace(/(Certifications\/Achievements)[\s:]+/i, "")
        .trim();
      const certList = certText
        .split("\n")
        .map((cert) => cert.trim())
        .filter(Boolean);
      addSection("Certifications/Achievements", certList, true, 8);
    }

    doc.moveDown(0.5);
    doc
      .fontSize(8)
      .font("Helvetica-Oblique")
      .text(
        `Generated on ${new Date().toLocaleString("en-US", {
          timeZone: "Asia/Kolkata",
        })}`,
        { align: "center" }
      );

    doc.end();
  } catch (error) {
    console.error("Error generating PDF:", error.message);
    res.status(500).json({ error: `Failed to generate PDF: ${error.message}` });
  }
});

app.get("/api/fetch-applications", async (req, res) => {
  try {
    const fetchedApplications = applications;
    broadcastApplications(fetchedApplications);
    res.status(200).json(fetchedApplications);
  } catch (error) {
    console.error("Error fetching applications:", error.message);
    res.status(500).json({ error: "Failed to fetch applications" });
  }
});

app.post("/api/analyze-skills", (req, res) => {
  analyzeSkills(req, res);
});

app.post("/api/recommend-internships", (req, res) => {
  recommendInternships(req, res);
});

app.post("/api/auto-apply", upload.single("resume"), (req, res) => {
  autoApply(req, res);
});

app.post("/api/auto-login", (req, res) => {
  autoLogin(req, res);
});

// WebSocket setup
wss.on("connection", (ws) => {
  console.log("Client connected to WebSocket");
  ws.send(JSON.stringify({ type: "JOBS_UPDATE", data: applications }));
  ws.on("close", () => {
    console.log("Client disconnected from WebSocket");
  });
});

server.listen(5000, () => {
  console.log("Server running on port 5000");
});
