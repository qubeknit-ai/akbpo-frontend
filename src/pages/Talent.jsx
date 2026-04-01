import { useMemo, useState, useEffect } from 'react'
import { Eye, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Search, AlertCircle, RefreshCcw } from 'lucide-react'
import TalentDetailsModal from '../modals/TalentDetailsModal'
import AddTalentModal from '../modals/AddTalentModal'
import EditTalentModal from '../modals/EditTalentModal'
import ConfirmModal from '../modals/ConfirmModal'
import toast from 'react-hot-toast'
import { logError } from '../utils/logger'

const TALENT_WEBHOOK_URL = 'https://n8n.srv1128153.hstgr.cloud/webhook/talent'
const RECOMMENDED_KEYWORDS = [
  ".NET",
  ".NET 5.0/6",
  ".NET Core",
  ".NET Core Web API",
  "4D",
  "A-GPS",
  "A/B Testing",
  "A+ Certified IT Technician",
  "A+ Certified Professional",
  "Ab Initio",
  "ABAP List Viewer (ALV)",
  "ABAP Web Dynpro",
  "Abaqus",
  "ABIS",
  "AbleCommerce",
  "Ableton",
  "Ableton Live",
  "Ableton Push",
  "AC3",
  "ACARS",
  "Accessibility",
  "Accessibility Consultancy",
  "Accessibility Testing",
  "Active Directory",
  "ActiveCampaign",
  "ADA",
  "Ada programming",
  "ADF / Oracle ADF",
  "ADO.NET",
  "Adobe Acrobat",
  "Adobe Air",
  "Adobe Analytics",
  "Adobe Animate",
  "Adobe Audition",
  "Adobe Captivate",
  "Adobe Creative Cloud",
  "Adobe Dynamic Tag Management",
  "Adobe Experience Manager",
  "Adobe Freehand",
  "Adobe Illustrator",
  "Adobe Muse",
  "Adobe Pagemaker",
  "Adobe Premiere Pro",
  "Adobe Systems",
  "Adobe Workfront",
  "Adobe XD",
  "Advanced Business Application Programming (ABAP)",
  "Affectiva",
  "Agile Development",
  "Agile Project Management",
  "Agora",
  "AI/RPA development",
  "Airtable",
  "AIX Administration",
  "AJAX",
  "AJAX Frameworks",
  "AJAX Toolkit",
  "Ajax4JSF",
  "Akka",
  "Alacra",
  "ALBPM",
  "Alexa Modification",
  "Algolia",
  "Algorand",
  "Algorithm Analysis",
  "Alias",
  "Alibaba",
  "Alibre Design",
  "Alienbrain",
  "All-Source Analysis",
  "AlphaCAM",
  "Alpine JS",
  "Altera Quartus",
  "Alteryx",
  "Altium Designer",
  "Altium NEXUS",
  "Alvarion",
  "Amazon App Development",
  "Amazon CloudFormation",
  "Amazon CloudFront",
  "Amazon ECS",
  "Amazon FBA",
  "Amazon Listings Optimization",
  "Amazon Product Launch",
  "Amazon S3",
  "Amazon Web Services",
  "Amelia",
  "Amibroker Formula Language",
  "AMQP",
  "Analytics",
  "Anaplan",
  "Android App Development",
  "Android SDK",
  "Android Studio",
  "Android Wear SDK",
  "Angular",
  "Angular 4",
  "Angular 6",
  "Angular Material",
  "AngularJS",
  "Ansible",
  "Ansys",
  "AODA",
  "Apache",
  "Apache Ant",
  "Apache Hadoop",
  "Apache Kafka",
  "Apache Maven",
  "Apache Solr",
  "Apache Spark",
  "API",
  "API Development",
  "API Integration",
  "API Testing",
  "Apigee",
  "Apollo",
  "App Developer",
  "App Development",
  "App Localization",
  "App Publication",
  "App Reskin",
  "Appfolio",
  "Appian BPM",
  "Apple Safari",
  "Apple UIKit",
  "Apple Xcode",
  "Applescript",
  "Application Packaging",
  "Application Performance Monitoring",
  "AppSheet Development",
  "Apttus",
  "AR / VR 3D Asset",
  "ArangoDB",
  "Arc",
  "ArcGIS",
  "ArchiCAD",
  "Architectural Engineering",
  "ArcMap",
  "ARCore",
  "Arena Simulation Programming",
  "Argus Monitoring Software",
  "Ariba",
  "ARKit",
  "Armadillo",
  "Articulate Storyline",
  "Artificial Intelligence",
  "AS400 & iSeries",
  "Asana",
  "ASM",
  "ASP",
  "ASP.NET",
  "ASP.NET MVC",
  "Aspen HYSYS",
  "Assembla",
  "Assembly",
  "Asterisk PBX",
  "Atlassian Confluence",
  "Atlassian Jira",
  "Atmel",
  "Augmented Reality",
  "AutoCAD Advance Steel",
  "AutoHotkey",
  "Automatic Number Plate Recognition (ANPR)",
  "Automation",
  "Automation Codeless Program",
  "AutoML",
  "Avaya",
  "AWS Amplify",
  "AWS Lambda",
  "AWS Polly",
  "AWS SageMaker",
  "AWS Textract",
  "AWS Translate",
  "Azure",
  "Backbase",
  "backbone.js",
  "Backend Development",
  "Background Removal",
  "Backtesting",
  "Baidu",
  "Balsamiq",
  "Bash",
  "Bash Scripting",
  "BeautifulSoup",
  "Big Data",
  "Big Data Sales",
  "BigCommerce",
  "BigQuery",
  "Binance",
  "Binance Smart Chain",
  "Binary Analysis",
  "Binary Search",
  "Bioinformatics",
  "Biostatistics",
  "BIRT Development",
  "Bitcoin",
  "BitMEX",
  "BitMEX API",
  "Bitrix",
  "Biztalk",
  "Blazor",
  "Blender",
  "Blockchain",
  "Blog Install",
  "Bluebeam",
  "Bluetooth Low Energy (BLE)",
  "BMC Remedy",
  "Boonex Dolphin",
  "Boost",
  "Bower",
  "Braintree",
  "BSD",
  "Bubble Developer",
  "BuddyPress",
  "Buildbox",
  "Bukkit",
  "Business Catalyst",
  "Business Central",
  "Business Intelligence",
  "C Programming",
  "C# Programming",
  "C++ Programming",
  "CakePHP",
  "Call Control XML",
  "Camio software",
  "Camtasia",
  "CAN Bus",
  "CapCut",
  "Cardano",
  "CARLA",
  "Carthage",
  "CasperJS",
  "Caspio",
  "Cassandra",
  "Celery",
  "CentOs",
  "Certified Ethical Hacking",
  "Certified Information Systems Security Professional (CISSP)",
  "Chart.js",
  "Charts",
  "Chatbot",
  "ChatGPT",
  "ChatGPT Search Optimization",
  "Chef Configuration Management",
  "Chordiant",
  "Chrome OS",
  "Chromium",
  "CI/CD",
  "Cinematography",
  "CircleCI",
  "CircuitMaker",
  "CircuitStudio",
  "Cisco",
  "Citadela",
  "Citrix",
  "ClickUp",
  "CLIPS",
  "Clojure",
  "Cloud",
  "Cloud Computing",
  "Cloud Custodian",
  "Cloud Data",
  "Cloud Development",
  "Cloud Finance",
  "Cloud Foundry",
  "Cloud Monitoring",
  "Cloud Networking",
  "Cloud Procurement",
  "Cloud Security",
  "Cloudflare",
  "Clover",
  "CMS",
  "CNC",
  "COBOL",
  "Cocoa",
  "Cocoa Touch",
  "CocoaPods",
  "Cocos2d",
  "Codeigniter",
  "Coding",
  "CoffeeScript",
  "Cognos",
  "Cold Fusion",
  "Color Contrast Analyzer",
  "COMPASS",
  "CompTIA",
  "Computer Graphics",
  "Computer Science",
  "Computer Security",
  "Computer Vision",
  "Construct 3",
  "Content Management System (CMS)",
  "Copyright",
  "Corda",
  "Cordana",
  "Core PHP",
  "Corel Draw",
  "Corteza",
  "cPanel",
  "CRE Loaded",
  "Creo",
  "Crestron",
  "Cross Browser",
  "Crowdstrike",
  "Cryptocurrency",
  "CS-Cart",
  "CSS2",
  "CSS3",
  "CubeCart",
  "CUDA",
  "cURL",
  "CV Library",
  "cxf",
  "D3.js",
  "Dall-E",
  "Dapper",
  "DApps",
  "Dart",
  "Data Backup",
  "Data Collection",
  "Data Governance",
  "Data Integration",
  "Data Management",
  "Data Modeling",
  "Data Modernization",
  "Data Visualization",
  "Data Warehousing",
  "Database Administration",
  "Database Development",
  "Database Programming",
  "DataLife Engine",
  "Datatables",
  "DDA",
  "DDS",
  "Debian",
  "Debugging",
  "Delphi",
  "DEMAT",
  "Desktop Application",
  "Development",
  "Development Operations",
  "DIALux",
  "Digital Marketing",
  "Digital Operations",
  "Digital Signal Processing",
  "Digital System Engineering",
  "DigitalOcean",
  "DirectX",
  "Discord API",
  "Distributed Systems",
  "Django",
  "DNS",
  "Docker",
  "Docker Compose",
  "Documentation",
  "Dogecoin",
  "Dojo",
  "DOM",
  "DOS",
  "DotNetNuke",
  "Dovecot",
  "Draw.io",
  "Dropbox API",
  "Drupal",
  "Dthreejs",
  "Dynamic 365",
  "Dynamics",
  "Dynatrace",
  "Dynatrace Software Monitoring",
  "EC Pay Workday",
  "Eclipse",
  "ECMAScript",
  "eCommerce",
  "Editorial Design",
  "edX",
  "Elasticsearch",
  "eLearning",
  "Electron JS",
  "Electronic Data Interchange (EDI)",
  "Electronic Forms",
  "Elementor",
  "ElevenLabs",
  "Elixir",
  "Elm",
  "Email Developer",
  "Embedded Software",
  "Ember.js",
  "Enterprise Architecture",
  "Ergo",
  "Erlang",
  "ERP Software",
  "ES8 Javascript",
  "Espruino",
  "Ethereum",
  "Etherscan",
  "ETL",
  "Expo",
  "Express JS",
  "Expression Engine",
  "Ext JS",
  "F#",
  "Face Recognition",
  "Facebook API",
  "Facebook Development",
  "Facebook Pixel",
  "Facebook Product Catalog",
  "Facebook SDK",
  "FastAPI",
  "Fastlane",
  "FaunaDB",
  "Fedora",
  "Figma",
  "FileMaker",
  "Financial Software Development",
  "FinTech",
  "Firefox",
  "Firewall",
  "Firmware",
  "FLANN",
  "Flask",
  "Flutter",
  "Formstack",
  "Forth",
  "Fortran",
  "Forum Software",
  "FoxyCart",
  "Freelancer API",
  "FreeSwitch",
  "Frontend Development",
  "Frontend Frameworks",
  "Fruugo",
  "Full Stack Development",
  "Funnel",
  "Fusion 360",
  "Game Consoles",
  "Game Design",
  "Game Development",
  "GameMaker",
  "GameSalad",
  "Gamification",
  "Garmin IQ",
  "GatsbyJS",
  "Gazebo",
  "GCP AI",
  "GenAI",
  "Generative Engine Optimization (GEO)",
  "Genesis 4D",
  "Genetic Algebra Modelling System",
  "Geofencing",
  "Geographical Information System (GIS)",
  "GeoJSON",
  "GeoServer",
  "GIMP",
  "Git",
  "GitHub",
  "GitLab",
  "GoDaddy",
  "Godot",
  "Golang",
  "Google Analytics",
  "Google APIs",
  "Google App Engine",
  "Google Apps Scripts",
  "Google Buzz",
  "Google Canvas",
  "Google Cardboard",
  "Google Checkout",
  "Google Chrome",
  "Google Cloud Platform",
  "Google Cloud Storage",
  "Google Data Studio",
  "Google Docs",
  "Google Earth",
  "Google Firebase",
  "Google Maps API",
  "Google PageSpeed Insights",
  "Google Plus",
  "Google Search",
  "Google Sheets",
  "Google Systems",
  "Google Tag Management",
  "Google Wave",
  "Google Web Toolkit",
  "Google Webmaster Tools",
  "GoPro",
  "GPGPU",
  "GPT Vision API",
  "GPT-3",
  "GPT-4",
  "GPT-4V",
  "Gradio",
  "Grails",
  "Graphical Network Simulator-3",
  "Graphics Programming",
  "GraphQL",
  "Gravity Forms",
  "Graylog",
  "Grease Monkey",
  "GrooveFunnels",
  "Growth Hacking",
  "Grunt",
  "GTK+",
  "GTmetrix",
  "Guacamole",
  "Guidewire",
  "Gulp.js",
  "Hadoop",
  "Handlebars.js",
  "Hardware Security Module",
  "Haskell",
  "HBase",
  "Heroku",
  "Heron",
  "Hewlett Packard",
  "HeyGen",
  "HFT",
  "Hibernate",
  "Highcharts",
  "HIPAA",
  "Hive",
  "HomeKit",
  "Houdini",
  "HP Openview",
  "HP-UX",
  "HTC Vive",
  "HTML",
  "HTML5",
  "HTTP",
  "Hubspot",
  "Hugo",
  "Humanoid Robotics",
  "Hybrid App",
  "Hybris",
  "Hyperledger",
  "Hyperledger Fabric",
  "HyperMesh",
  "iBeacon",
  "IBM Bluemix",
  "IBM BPM",
  "IBM Cloud",
  "IBM Datapower",
  "IBM Integration bus",
  "IBM MQ",
  "IBM Tivoli",
  "IBM Tririga",
  "IBM Websphere Transformation Tool",
  "IIS",
  "iMacros",
  "IMAP",
  "Infor",
  "Informatica",
  "Informatica MDM",
  "Informatica Powercenter ETL",
  "Instagram",
  "Instagram API",
  "Internet Security",
  "Interspire",
  "Ionic Framework",
  "Ionic React",
  "iOS Development",
  "IT Operating Model",
  "IT Project Management",
  "IT strategy",
  "IT Transformation",
  "ITIL",
  "J2EE",
  "Jabber",
  "Jade Development",
  "Jamf",
  "Jamstack",
  "Jasmine Javascript",
  "Java",
  "Java ME",
  "Java Spring",
  "Java Technical Architecture",
  "JavaFX",
  "JavaScript",
  "Javascript ES6",
  "JAWS",
  "JD Edwards CNC",
  "Jenkins",
  "Jimdo",
  "Jinja2",
  "Jitsi",
  "JMeter",
  "Joomla",
  "jqGrid",
  "jQuery",
  "jQuery / Prototype",
  "JSON",
  "JSP",
  "JUCE",
  "Julia Development",
  "Julia Language",
  "Juniper",
  "JUnit",
  "K2",
  "Kajabi",
  "Karma Javascript",
  "Kendo UI",
  "Keras",
  "Keyboard Testing",
  "Keycloak",
  "Keyshot",
  "Kibana",
  "Kinect",
  "KNIME",
  "Knockout.js",
  "Kubernetes",
  "LabVIEW",
  "LAMP",
  "Laravel",
  "Leap Motion SDK",
  "LearnDash",
  "Learning Management Solution (LMS) Consulting",
  "Learning Management Systems (LMS)",
  "LESS/Sass/SCSS",
  "LIBSVM",
  "LIMS (Laboratory Information Management System)",
  "Linear Regression",
  "Link Building",
  "Linkedin",
  "LINQ",
  "Linux",
  "LinuxCNC",
  "Liquid Template",
  "Lisp",
  "Litecoin",
  "LiveCode",
  "Local Area Networking",
  "Lottie",
  "Lotus Notes",
  "Low Code",
  "Lua",
  "Lucee",
  "Lucene",
  "Lumion",
  "Lynx",
  "Mac OS",
  "Magento",
  "Magento 2",
  "Magic Leap",
  "Magnolia",
  "MailerLite",
  "Make.com",
  "Managed Analytics",
  "Map Reduce",
  "MapKit",
  "MariaDB",
  "MEAN Stack",
  "MERN",
  "MERN Stack",
  "Messenger Marketing",
  "Meta Pixel",
  "Metal",
  "Metamask",
  "Metatrader",
  "MetaTrader 4",
  "Metatrader 5",
  "MeteorJS",
  "Micropython",
  "Micros RES",
  "Microsoft",
  "Microsoft 365",
  "Microsoft Access",
  "Microsoft Azure",
  "Microsoft Exchange",
  "Microsoft Expression",
  "Microsoft Graph",
  "Microsoft Hololens",
  "Microsoft PowerBI",
  "Microsoft Project",
  "Microsoft SQL Server",
  "Microsoft Visio",
  "MicroStrategy",
  "Minecraft",
  "Mininet",
  "Minitab",
  "MMORPG",
  "Mobile Accessibility",
  "Mobile App Audit",
  "Mobile App Testing",
  "Mobile Development",
  "Modding",
  "MODx",
  "Moho",
  "Monday.com",
  "MonetDB",
  "MongoDB",
  "Monkey C",
  "Moodle",
  "MOVEit",
  "Moz",
  "MPT MosaicML",
  "MQL4",
  "MQL5",
  "MQTT",
  "Mule",
  "MuleSoft",
  "MVC",
  "MyBB",
  "MySpace",
  "MySQL",
  "n8n",
  "Nagios Core",
  "National Building Specification",
  "NAV",
  "Nest.js",
  "Netbeans",
  "Netlify",
  "NetSuite",
  "Network Administration",
  "Network Engineering",
  "Network Monitoring",
  "Network Security",
  "Next.js",
  "Nginx",
  "NgRx",
  "Ning",
  "NinjaTrader",
  "NLP",
  "Node.js",
  "Non-fungible Tokens (NFT)",
  "NoSQL",
  "NoSQL Couch & Mongo",
  "NotebookLM",
  "Notion",
  "NumPy",
  "Nuxt.JS",
  "NVDA",
  "OAuth",
  "Object Oriented Programming (OOP)",
  "Objective C",
  "OCR",
  "OctoberCMS",
  "Oculus Mobile SDK",
  "Oculus Rift",
  "Odoo",
  "Office 365",
  "Office Add-ins",
  "Offline Conversion Facebook API Integration",
  "OKTA",
  "Online Multiplayer",
  "Open Cart",
  "Open Interpreter",
  "Open Journal Systems",
  "Open Source",
  "OpenAI",
  "OpenBravo",
  "OpenBSD",
  "OpenCL",
  "OpenCV",
  "OpenGL",
  "OpenNMS",
  "OpenSCAD",
  "OpenSceneGraph",
  "OpenSSL",
  "OpenStack",
  "OpenVMS",
  "OpenVPN",
  "OpenVZ",
  "Oracle",
  "Oracle Analytics",
  "Oracle APEX",
  "Oracle Database",
  "Oracle EBS Tech Integration",
  "Oracle Hyperion",
  "Oracle OBIA",
  "Oracle OBIEE",
  "Oracle Primavera",
  "Oracle Retail",
  "OSCommerce",
  "OTT",
  "Outreach.io",
  "P2P Network",
  "Packaging Technology",
  "Page Speed Optimization",
  "Pandas",
  "Papiamento",
  "Parallax Scrolling",
  "Parallel Processing",
  "Parallels Automation",
  "Parallels Desktop",
  "Pardot Development",
  "Pascal",
  "Pattern Matching",
  "Payment Gateway Integration",
  "PayPal",
  "PayPal API",
  "Paytrace",
  "PC Programming",
  "PCI Compliance",
  "PEGA PRPC",
  "PencilBlue CMS",
  "Penetration Testing",
  "Pentaho",
  "Performance Tuning",
  "Perl",
  "Phi (Microsoft)",
  "Phoenix",
  "PhoneGap",
  "Photon Multiplayer",
  "Photoshop Coding",
  "PHP",
  "PHP Slim",
  "phpBB",
  "phpFox",
  "phpMyAdmin",
  "PhpNuke",
  "PHPrunner",
  "PHPUnit",
  "PICK Multivalue DB",
  "PikaLabs",
  "Pine Script",
  "Pinterest",
  "Pipedrive",
  "PlayFab",
  "Playstation VR",
  "PLC",
  "Plesk",
  "Plivo",
  "Plugin",
  "Plutus",
  "Point of Sale",
  "Polarion",
  "Polkadot",
  "Polyworks Inspector",
  "Polyworks Software",
  "POS development",
  "PoseNet",
  "Postfix",
  "PostgreSQL",
  "PostgreSQL Programming",
  "Power Automate",
  "Power BI",
  "PowerApps",
  "Powershell",
  "Powtoon",
  "Predictive Analytics",
  "Prestashop",
  "Process Simulation",
  "Programming",
  "Progressive Web Apps",
  "Prolog",
  "Prometheus Monitoring",
  "Proto",
  "Protoshare",
  "Prototyping",
  "Protractor Javascript",
  "Puck.js",
  "Puppet",
  "PureScript",
  "Push Notification",
  "PyCaret",
  "PySpark",
  "Python",
  "Pytorch",
  "QlikView",
  "QR Code Making",
  "Qt",
  "Quadruped Robotics",
  "Quality Engineering",
  "Qualtrics Survey Platform",
  "Quanum",
  "Quarkus",
  "QuickBase",
  "Quora",
  "R Programming Language",
  "RabbitMQ",
  "Racket",
  "RapidWeaver",
  "Raspberry Pi",
  "Ratio Analysis",
  "Ray-tracing",
  "Razor Template Engine",
  "React Native",
  "React.js",
  "React.js Framework",
  "REALbasic",
  "Reason",
  "Rebranding",
  "Red Hat",
  "Redis",
  "Redmine",
  "Redshift",
  "Redux.js",
  "Regression Testing",
  "Regular Expressions",
  "Relux",
  "Replit",
  "REST API",
  "RESTful",
  "RESTful API",
  "Retrieval-Augemented Generation",
  "Reverse Engineering",
  "Revit",
  "Revit Architecture",
  "RichFaces",
  "Roadnet",
  "Roblox",
  "Robot Operating System (ROS)",
  "Rocket Engine",
  "Roslyn",
  "RPA Development",
  "RPG Development",
  "RSS",
  "Ruby",
  "Ruby on Rails",
  "Rust",
  "RxJS",
  "Ryu Controller",
  "SaaS",
  "Sails.js",
  "Salesforce App Development",
  "Salesforce Commerce Cloud",
  "Salesforce Marketing Cloud",
  "Samsung Accessory SDK",
  "SAP",
  "SAP 4 Hana",
  "SAP BODS",
  "SAP Business Planning and Consolidation",
  "SAP CPI",
  "SAP HANA",
  "SAP Hybris",
  "SAP Pay",
  "SAP PI",
  "SAP Screen Personas",
  "SAP Transformation",
  "Sass",
  "Scala",
  "Scheme",
  "Scikit Learn",
  "SciPy",
  "SCORM",
  "Scrapy",
  "Screen Reader Compatibility",
  "Script Install",
  "Scripting",
  "Scrivener",
  "Scrum",
  "Scrum Development",
  "SD-WAN",
  "SDW N17 Service Qualification",
  "Section 508",
  "Segment",
  "Selenium",
  "Selenium Webdriver",
  "SEO",
  "SEO Auditing",
  "Server",
  "Server to Server Facebook API Integration",
  "ServiceNow",
  "SFDC",
  "Sharepoint",
  "Shell Script",
  "Shopify",
  "Shopify Development",
  "Shopping Cart Integration",
  "Siebel",
  "Silverlight",
  "SIP",
  "Sketch",
  "Sketching",
  "Slack",
  "Smart Contracts",
  "Smarty PHP",
  "SMTP",
  "Snapchat",
  "Snowflake",
  "SOAP API",
  "Social Engine",
  "Social Media Management",
  "Social Networking",
  "Socket IO",
  "Software Architecture",
  "Software Development",
  "Software Engineering",
  "Software Performance Testing",
  "Software Testing",
  "Solana",
  "Solaris",
  "Soldering",
  "Solidity",
  "Solutions Architecture",
  "Spark",
  "Sphinx",
  "Splunk",
  "Spring Boot",
  "Spring Data",
  "Spring JPA",
  "Spring Security",
  "SPSS Statistics",
  "SQL",
  "SQLite",
  "Squarespace",
  "Squid Cache",
  "SSIS (SQL Server Integration Services)",
  "SSL",
  "Stable Diffusion",
  "Steam API",
  "Storage Area Networks",
  "Storm",
  "Strapi",
  "Stripe",
  "Subversion",
  "SugarCRM",
  "SurveyMonkey",
  "Svelte",
  "SVG",
  "Swift",
  "Swift Package Manager",
  "Swing (Java)",
  "Symfony PHP",
  "System Admin",
  "System Administration",
  "System Analysis",
  "T-SQL (Transact Structures Query Language)",
  "Tableau",
  "TailWind",
  "Tailwind CSS",
  "TALKBACK",
  "Tally Definition Language",
  "TaoBao API",
  "Tealium",
  "TeamCity",
  "Technology Consulting",
  "Telegram API",
  "Telerik",
  "Tensorflow",
  "Teradata",
  "Terra",
  "Terraform",
  "Test",
  "Test Automation",
  "Testing / QA",
  "TestStand",
  "Tether",
  "Thermodynamics",
  "Three.js",
  "Tibco Spotfire",
  "Time & Labor SAP",
  "Tinkercad",
  "Titanium",
  "Tizen SDK for Wearables",
  "Toon Boom",
  "TopSolid",
  "TopSolid Wood",
  "TradeStation",
  "Travis CI",
  "TRON",
  "Troubleshooting",
  "Truffle",
  "Tumblr",
  "TvOS",
  "Twago",
  "Twilio",
  "Twitch",
  "Twitter",
  "Twitter API",
  "Typescript",
  "TYPO3",
  "Ubiquiti",
  "Ubuntu",
  "Udacity",
  "Umbraco",
  "UML Design",
  "Unbounce",
  "Underscore.js",
  "Unitree SDK Development",
  "Unity",
  "Unity 3D",
  "UNIX",
  "Unreal Engine",
  "Usability Testing",
  "User Experience Research",
  "User Interface / IA",
  "UI Design",
  "User Story Writing",
  "User Experience Design",
  "UX Research",
  "V-Play",
  "Vapor",
  "Varnish Cache",
  "VB.NET",
  "VBScript",
  "vBulletin",
  "Veeam",
  "Vercel",
  "Version Control Git",
  "Vertex AI",
  "VertexFX",
  "VideoHive",
  "Vim",
  "Virtual Machines",
  "Virtual Reality",
  "Virtual Worlds",
  "Virtuemart",
  "Virtuozzo",
  "Visual Basic",
  "Visual Basic for Apps",
  "Visual Foxpro",
  "Visual Studio",
  "Visualization",
  "VMware",
  "VoiceXML",
  "VoIP",
  "Volusion",
  "Vowpal Wabbit",
  "VPN",
  "VPS",
  "VSCode",
  "vTiger",
  "VtrunkD",
  "Vue.js",
  "Vue.js Framework",
  "Vuforia",
  "Vulkan",
  "Vymo",
  "WatchKit",
  "Web API",
  "Web Application",
  "Web Application Audit",
  "Web Content Accessibility Guidelines",
  "Web Crawling",
  "Web Design",
  "Web Development",
  "Web Hosting",
  "Web Scraping",
  "Web Security",
  "Web Services",
  "Web Testing",
  "Web3.js",
  "WEBDEV",
  "Webflow",
  "Weblogic",
  "webMethods",
  "Webpack",
  "WebRTC",
  "Website Accessibility",
  "Website Accessibility Remediation",
  "Website Analytics",
  "Website Audit",
  "Website Build",
  "Website Development",
  "Website Localization",
  "Website Management",
  "Website Optimization",
  "Website Testing",
  "Weebly",
  "White Hat SEO",
  "WHMCS",
  "Windchill PLM",
  "WINDEV",
  "WINDEV Mobile",
  "Windows 8"
];

const COUNTRY_OPTIONS = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cabo Verde",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Congo",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czechia",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Eswatini",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Honduras",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Italy",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Korea",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Palestine State",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Samoa",
  "San Marino",
  "Sao Tome and Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Korea",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Timor-Leste",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Vatican City",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
];




const normalizeTalents = (raw) => {
  if (!raw) return []

  const isTalentLike = (entry) => {
    if (!entry || typeof entry !== 'object') return false
    return Boolean(
      entry.username ||
      entry.name ||
      entry.full_name ||
      entry.title ||
      entry.detail ||
      entry.tagline ||
      entry.bio ||
      entry.description ||
      entry.skills
    )
  }

  const candidateKeys = ['talents', 'data', 'results', 'items', 'records', 'entries', 'payload']

  const extractEntries = (value, depth = 0) => {
    if (!value || depth > 3) return []
    if (Array.isArray(value)) return value
    if (typeof value === 'object') {
      if (isTalentLike(value)) return [value]

      for (const key of candidateKeys) {
        if (value[key]) {
          const nested = extractEntries(value[key], depth + 1)
          if (nested.length) return nested
        }
      }
    }
    return []
  }

  const list = extractEntries(raw)
  if (!list.length && isTalentLike(raw)) {
    return [raw]
  }

  const cleanNumber = (value) => {
    if (value == null) return null
    if (typeof value === 'number') return value
    const match = value.toString().replace(/,/g, '').match(/(\d+(\.\d+)?)/)
    return match ? Number(match[1]) : null
  }

  const cleanReviews = (value) => {
    if (value == null) return '—'
    if (typeof value === 'number') return value
    const match = value.toString().replace(/,/g, '').match(/(\d+)/)
    return match ? Number(match[1]) : value
  }

  return list.map((item, index) => {
    const rating = cleanNumber(item.rating ?? item.score ?? item.stars)
    const hourlyRateRaw =
      item.charges_per_hour ??
      item.charges ??
      item.rate ??
      item.hourly_rate ??
      item.price ??
      item.amount
    const hourlyRateNumeric = cleanNumber(hourlyRateRaw)
    const category =
      item.category ||
      item.specialization ||
      item.skill ||
      (Array.isArray(item.skills) ? item.skills.slice(0, 3).join(', ') : '—')

    return {
      id: item.id || item._id || item.uuid || item.username || `talent-${index + 1}`,
      name: item.username || item.name || item.full_name || item.title || `Talent ${index + 1}`,
      profileUrl: item.profile_url || item.url || item.link || '',
      country: item.country || item.location || '',
      detail:
        item.tagline ||
        item.detail ||
        item.description ||
        item.overview ||
        item.bio ||
        item.summary ||
        'No detail provided',
      category,
      rating: rating ?? (typeof item.rating === 'number' ? item.rating : '—'),
      charges:
        hourlyRateNumeric != null
          ? `$${hourlyRateNumeric}/h`
          : typeof hourlyRateRaw === 'string'
            ? hourlyRateRaw.trim()
            : '—',
      reviews:
        item.review_count ??
        item.total_reviews ??
        (Array.isArray(item.reviews) ? item.reviews.length : cleanReviews(item.reviews)),
      bio: item.bio || item.description || item.overview || '',
      tagline: item.tagline || '',
      skills: Array.isArray(item.skills) ? item.skills : [],
      earnings: item.earnings || item.total_earnings || '',
      image: item.image || item.avatar || item.profile_image || '',
    }
  })
}

const Talent = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedKeywords, setSelectedKeywords] = useState([])
  const [talents, setTalents] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastFetchedAt, setLastFetchedAt] = useState(null)
  const [selectedTalent, setSelectedTalent] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [country, setCountry] = useState("")
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [page, setPage] = useState(1)
  const [countryInput, setCountryInput] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [talentToEdit, setTalentToEdit] = useState(null)
  const [showSavedTalents, setShowSavedTalents] = useState(true)
  const [savedTalents, setSavedTalents] = useState([])
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [talentToDelete, setTalentToDelete] = useState(null)



  const hasResults = talents.length > 0

  // Load saved talents on component mount
  useEffect(() => {
    fetchSavedTalents()
  }, [])

  const filteredCountries = useMemo(() => {
  if (!countryInput.trim()) return COUNTRY_OPTIONS;
  return COUNTRY_OPTIONS.filter(c =>
    c.toLowerCase().includes(countryInput.trim().toLowerCase())
  );
}, [countryInput]);


  const lastFetchedLabel = useMemo(() => {
    if (!lastFetchedAt) return null
    return lastFetchedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }, [lastFetchedAt])

  const fetchTalents = async (keywords, pageNumber = 1) => {
    if (!keywords || keywords.length === 0) {
      setError('At least one keyword is required')
      setTalents([])
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Join keywords with comma
      const keywordString = Array.isArray(keywords) ? keywords.join(', ') : keywords
      
      const response = await fetch(TALENT_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keyword: keywordString, country, page: pageNumber, }),
      })

      if (!response.ok) {
        const detail = await response.text()
        throw new Error(detail || 'Failed to fetch talent data')
      }

      const payload = await response.json()
      const normalized = normalizeTalents(payload)

      // Check which talents are already saved
      const token = localStorage.getItem('token')
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      
      try {
        const savedResponse = await fetch(`${API_BASE_URL}/api/talents`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (savedResponse.ok) {
          const savedData = await savedResponse.json()
          const savedNames = savedData.talents.map(t => t.name.toLowerCase())
          
          // Mark talents as saved if they exist in saved list
          const markedTalents = normalized.map(talent => ({
            ...talent,
            isSaved: savedNames.includes(talent.name.toLowerCase())
          }))
          
          setTalents(markedTalents)
        } else {
          setTalents(normalized)
        }
      } catch (err) {
        setTalents(normalized)
      }

      setLastFetchedAt(new Date())
      setPage(pageNumber)
    } catch (err) {
      logError('Talent fetch failed', err)
      setError(err.message || 'Unable to fetch talent data. Please try again.')
      setTalents([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (event) => {
    event.preventDefault()
    
    // Add current search term to selected keywords if not empty
    if (searchTerm.trim() && !selectedKeywords.includes(searchTerm.trim())) {
      const newKeywords = [...selectedKeywords, searchTerm.trim()]
      setSelectedKeywords(newKeywords)
      setSearchTerm('')
      setShowSuggestions(false)
      setShowSavedTalents(false)
      fetchTalents(newKeywords, 1)
    } else if (selectedKeywords.length > 0) {
      setShowSuggestions(false)
      setShowSavedTalents(false)
      fetchTalents(selectedKeywords, 1)
    }
  }

  const filteredSuggestions = useMemo(() => {
    if (!searchTerm.trim()) return RECOMMENDED_KEYWORDS
    return RECOMMENDED_KEYWORDS.filter((keyword) =>
      keyword.toLowerCase().includes(searchTerm.trim().toLowerCase()) &&
      !selectedKeywords.includes(keyword)
    )
  }, [searchTerm, selectedKeywords])

  const handleSelectSuggestion = (suggestion) => {
    if (!selectedKeywords.includes(suggestion)) {
      setSelectedKeywords([...selectedKeywords, suggestion])
    }
    setSearchTerm('')
    setShowSuggestions(false)
    setPage(1)
  }

  const handleRemoveKeyword = (keywordToRemove) => {
    setSelectedKeywords(selectedKeywords.filter(k => k !== keywordToRemove))
  }

  const handleViewTalent = (talent) => {
    setSelectedTalent(talent)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedTalent(null)
  }

  const handleDeleteTalent = (talent) => {
    setTalentToDelete(talent)
    setIsConfirmModalOpen(true)
  }

  const confirmDeleteTalent = async () => {
    if (!talentToDelete) return

    try {
      const token = localStorage.getItem('token')
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      
      const response = await fetch(`${API_BASE_URL}/api/talents/${talentToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete talent')
      }

      // Show success toast
      toast.success('Talent deleted successfully!')
      
      // Refresh saved talents
      fetchSavedTalents()
      
      // Reset state
      setTalentToDelete(null)
    } catch (err) {
      logError('Delete talent failed', err)
      toast.error(err.message || 'Unable to delete talent. Please try again.')
      setTalentToDelete(null)
    }
  }

  const handleAddTalentSuccess = (newTalent) => {
    // Add to saved talents list
    setSavedTalents(prev => [newTalent, ...prev])
    // If currently viewing saved talents, refresh the view
    if (showSavedTalents) {
      fetchSavedTalents()
    }
    // Show success toast
    toast.success('Talent added successfully!')
  }

  const handleEditTalent = (talent) => {
    setTalentToEdit(talent)
    setIsEditModalOpen(true)
  }

  const handleEditTalentSuccess = (updatedTalent) => {
    // Refresh saved talents
    fetchSavedTalents()
    // Show success toast
    toast.success('Talent updated successfully!')
  }

  const fetchSavedTalents = async () => {
    setIsLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      
      const response = await fetch(`${API_BASE_URL}/api/talents`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch saved talents')
      }

      const data = await response.json()
      const normalized = normalizeSavedTalents(data.talents || [])
      setSavedTalents(normalized)
      setTalents(normalized)
      setShowSavedTalents(true)
      setLastFetchedAt(new Date())
    } catch (err) {
      logError('Saved talents fetch failed', err)
      setError(err.message || 'Unable to fetch saved talents. Please try again.')
      setSavedTalents([])
    } finally {
      setIsLoading(false)
    }
  }

  const normalizeSavedTalents = (savedList) => {
    return savedList.map((item) => ({
      id: item.id,
      name: item.name,
      profileUrl: item.profile_url || '',
      country: item.location || '',
      detail: item.description || 'No description provided',
      category: Array.isArray(item.skills) ? item.skills.slice(0, 3).join(', ') : '—',
      rating: item.rating !== undefined && item.rating !== null ? item.rating : '—',
      charges: item.rate ? `$${item.rate}/h` : '—',
      reviews: item.reviews !== undefined && item.reviews !== null ? item.reviews : '—',
      bio: item.description || '',
      tagline: '',
      skills: Array.isArray(item.skills) ? item.skills : [],
      earnings: '',
      image: item.image_url || '',
      isSaved: true,
      savedId: item.id
    }))
  }

  const checkIfTalentSaved = async (talentName) => {
    try {
      const token = localStorage.getItem('token')
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      
      const response = await fetch(`${API_BASE_URL}/api/talents`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        return data.talents.some(t => t.name.toLowerCase() === talentName.toLowerCase())
      }
      return false
    } catch (err) {
      return false
    }
  }

  const saveTalent = async (talent) => {
    try {
      const token = localStorage.getItem('token')
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      
      const response = await fetch(`${API_BASE_URL}/api/talents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: talent.name,
          description: talent.detail || talent.bio,
          rate: talent.charges && talent.charges !== '—' ? parseFloat(talent.charges.replace(/[^0-9.]/g, '')) : null,
          rating: talent.rating !== '—' ? parseFloat(talent.rating) : null,
          reviews: talent.reviews !== '—' ? parseInt(talent.reviews) : null,
          skills: talent.skills || [],
          location: talent.country,
          profile_url: talent.profileUrl,
          image_url: talent.image
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save talent')
      }

      // Mark talent as saved in the current list
      setTalents(prev => prev.map(t => 
        t.name === talent.name ? { ...t, isSaved: true } : t
      ))
      
      toast.success('Talent saved successfully!')
    } catch (err) {
      logError('Failed to save talent', err)
      toast.error('Failed to save talent. Please try again.')
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8  min-h-full space-y-6">
      {/* Action Buttons - Left aligned */}
      <div className="flex justify-start gap-3">
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-900 hover:bg-blue-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors"
        >
          <Plus size={18} />
          Add Talent
        </button>
        <button
          type="button"
          onClick={fetchSavedTalents}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-400 shadow-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Saved Talents
        </button>
      </div>

      <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-200 dark:border-gray-700 p-5 sm:p-6 shadow-sm">

        <form onSubmit={handleSearch} className="flex flex-col gap-3">
          
          {/* Selected Keywords Pills */}
          {selectedKeywords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedKeywords.map((keyword) => (
                <span
                  key={keyword}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-medium"
                >
                  {keyword}
                  <button
                    type="button"
                    onClick={() => handleRemoveKeyword(keyword)}
                    className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            {/* Keyword input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setShowSuggestions(true)
                }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchTerm.trim()) {
                    e.preventDefault()
                    handleSelectSuggestion(searchTerm.trim())
                  }
                }}
                placeholder="Use 'Artificial Intelligence', not 'AI'"
                className="w-full rounded-xl border border-gray-200 dark:border-gray-600 py-3 pl-10 pr-3 text-sm bg-white dark:bg-[#1e1e1e] text-gray-900 dark:text-gray-300"
              />

              {/* Keyword suggestions */}
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 max-h-60 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-[#1e1e1e] shadow-lg z-10">
                  {filteredSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => handleSelectSuggestion(suggestion)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>

          {/* Country Dropdown */}
          <div className="relative w-full sm:w-48">
  <input
    type="text"
    value={countryInput}
    onChange={(e) => {
      setCountryInput(e.target.value);
      setShowCountryDropdown(true);
    }}
    onFocus={() => setShowCountryDropdown(true)}
    placeholder="Select Country"
    className="w-full rounded-xl border border-gray-200 dark:border-gray-600 px-3 py-3 text-sm bg-white dark:bg-[#1e1e1e] text-gray-900 dark:text-gray-300"
  />

  {showCountryDropdown && filteredCountries.length > 0 && (
    <div className="absolute left-0 right-0 mt-2 max-h-60 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-[#1e1e1e] shadow-lg z-10">
      {filteredCountries.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => {
            setCountry(c);          // save selected country
            setCountryInput(c);     // show selected country in input
            setShowCountryDropdown(false);
            setPage(1);
          }}
          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          {c}
        </button>
      ))}
    </div>
  )}
</div>

          {/* Search Button */}
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-sm"
            style={{ backgroundColor: '#b59d32' }}
          >
            Search Talent
          </button>
          </div>
        </form>


        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-200 dark:border-gray-700 p-0 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          {/* Left side: title and subtitle */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-300">
              {showSavedTalents ? 'Saved Talents' : 'Talent Results'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {hasResults ? `${talents.length} matches` : 'No data yet'}
            </p>
          </div>

          {/* Right side: buttons */}
          {hasResults && !showSavedTalents && (
            <div className="flex gap-2">
              <button
                onClick={() => fetchTalents(selectedKeywords, page - 1)}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-400 bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <button
                onClick={() => fetchTalents(selectedKeywords, page + 1)}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-400 bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>


        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 dark:bg-[#212121]">
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                <th className="px-6 py-3 dark:text-gray-300">Talent</th>
                <th className="px-6 py-3 dark:text-gray-300">Detail</th>
                <th className="px-6 py-3 dark:text-gray-300">Rating</th>
                <th className="px-6 py-3 dark:text-gray-300">Charges / h</th>
                <th className="px-6 py-3 dark:text-gray-300">Reviews</th>
                <th className="px-6 py-3 dark:text-gray-300 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-[#1e1e1e] text-sm">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCcw className="animate-spin text-gray-400" size={20} />
                      <span>Fetching talent records...</span>
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading && !hasResults && !error && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    {showSavedTalents 
                      ? 'No saved talents yet. Click "Add Talent" to save your first talent.'
                      : 'Start by searching for a skill keyword to load matching talent profiles.'}
                  </td>
                </tr>
              )}

              {!isLoading &&
                talents.map((talent) => (
                  <tr key={talent.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 text-gray-900">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:bg-[#1e1e1e]">
                          {talent.image ? (
                            <img
                              src={talent.image}
                              alt={talent.name}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-gray-500">
                              {talent.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col">
                          {talent.profileUrl ? (
                            <a
                              href={
                                talent.profileUrl.startsWith('http')
                                  ? talent.profileUrl
                                  : `https://www.freelancer.com${talent.profileUrl}`
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm font-semibold text-indigo-600 hover:underline dark:text-gray-300"
                            >
                              {talent.name}
                            </a>
                          ) : (
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-300 dark:text-gray-300">{talent.name}</span>
                          )}
                          {talent.country && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-300">{talent.country}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 max-w-md">
                      <p className="line-clamp-3 dark:text-gray-300">{talent.detail}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-900 dark:text-gray-300">
                      {talent.rating !== undefined && talent.rating !== null ? talent.rating : '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-900 dark:text-gray-300">{talent.charges || '—'}</td>
                    <td className="px-6 py-4 text-gray-900 dark:text-gray-300">{talent.reviews ?? '—'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end dark:text-gray-300">
                        {showSavedTalents ? (
                          <button
                            onClick={() => handleEditTalent(talent)}
                            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors dark:text-gray-300"
                          >
                            Edit
                          </button>
                        ) : !talent.isSaved ? (
                          <button
                            onClick={() => saveTalent(talent)}
                            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-colors dark:text-gray-300"
                            style={{ backgroundColor: '#b59d32' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#9a8429'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#b59d32'}
                          >
                            Save
                          </button>
                        ) : null}
                        {showSavedTalents ? (
                          <button
                            onClick={() => handleDeleteTalent(talent)}
                            className="inline-flex items-center gap-1 rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 transition-colors"
                          >
                            Delete
                          </button>
                        ) : (
                          <button
                            onClick={() => handleViewTalent(talent)}
                            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            View
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>


        </div>
      </div>

      <TalentDetailsModal talent={selectedTalent} isOpen={isModalOpen} onClose={handleCloseModal} />
      <AddTalentModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={handleAddTalentSuccess}
      />
      <EditTalentModal 
        isOpen={isEditModalOpen} 
        onClose={() => {
          setIsEditModalOpen(false)
          setTalentToEdit(null)
        }} 
        onSuccess={handleEditTalentSuccess}
        talent={talentToEdit}
      />
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => {
          setIsConfirmModalOpen(false)
          setTalentToDelete(null)
        }}
        onConfirm={confirmDeleteTalent}
        title="Delete Talent"
        message={`Are you sure you want to delete "${talentToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        isDangerous={true}
      />
    </div>
  )
}

export default Talent


