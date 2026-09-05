import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import readline from "readline";

const prisma = new PrismaClient();

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {};
  for (const arg of args) {
    if (arg.startsWith("--email=")) parsed.email = arg.split("=")[1];
    else if (arg.startsWith("--password=")) parsed.password = arg.split("=")[1];
    else if (arg.startsWith("--name=")) parsed.name = arg.split("=")[1];
    else if (arg === "--help" || arg === "-h") parsed.help = true;
  }
  return parsed;
}

function promptQuestion(rl, query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function main() {
  const args = parseArgs();

  if (args.help) {
    console.log(`
Usage:
  node scripts/create-admin.mjs [options]

Options:
  --email=<email>        Admin email address
  --password=<password>  Admin password (min 6 characters)
  --name=<name>          Admin full name (default: "System Administrator")
  --help, -h             Show this help guide

Example:
  node scripts/create-admin.mjs --email=owner@myacademy.com --password=SecurePass123 --name="My Admin"
`);
    process.exit(0);
  }

  let { email, password, name } = args;

  if (!email || !password) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    console.log("\n=======================================================");
    console.log(" 👑 E-Learning Platform — Super Admin Creation Wizard");
    console.log("=======================================================\n");

    if (!name) {
      name = await promptQuestion(rl, "Enter Admin Full Name [System Administrator]: ");
      name = name.trim() || "System Administrator";
    }

    if (!email) {
      email = await promptQuestion(rl, "Enter Admin Email: ");
      email = email.trim().toLowerCase();
    }

    if (!password) {
      password = await promptQuestion(rl, "Enter Admin Password (min 6 chars): ");
      password = password.trim();
    }

    rl.close();
  }

  if (!email || !email.includes("@")) {
    console.error("❌ Error: Invalid email address provided.");
    process.exit(1);
  }

  if (!password || password.length < 6) {
    console.error("❌ Error: Password must be at least 6 characters long.");
    process.exit(1);
  }

  const finalName = name?.trim() || "System Administrator";
  const passwordHash = await bcrypt.hash(password, 10);

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    const updated = await prisma.user.update({
      where: { email },
      data: {
        role: "ADMIN",
        passwordHash,
        name: finalName,
        emailVerified: new Date(),
      },
    });

    console.log("\n✅ SUCCESS: Existing user updated with ADMIN privileges!");
    console.log(`- Name:  ${updated.name}`);
    console.log(`- Email: ${updated.email}`);
    console.log(`- Role:  ${updated.role}`);
    console.log("You can now log in at: /auth/login\n");
  } else {
    const created = await prisma.user.create({
      data: {
        name: finalName,
        email,
        passwordHash,
        role: "ADMIN",
        emailVerified: new Date(),
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
        headline: "System Administrator & Academy Founder",
        bio: "Root administrator for this e-learning portal.",
      },
    });

    console.log("\n🎉 SUCCESS: New Super Admin account successfully created!");
    console.log(`- Name:  ${created.name}`);
    console.log(`- Email: ${created.email}`);
    console.log(`- Role:  ${created.role}`);
    console.log("You can now log in at: /auth/login\n");
  }
}

main()
  .catch((err) => {
    console.error("❌ Fatal Error creating admin:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
