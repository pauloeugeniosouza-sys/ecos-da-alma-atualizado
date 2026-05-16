import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, newsletterSubscribers, InsertNewsletterSubscriber, memories, InsertMemory } from "../drizzle/schema";
import { ENV } from './_core/env';
import nodemailer from 'nodemailer';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// TODO: add feature queries here as your schema grows.

/**
 * Newsletter Subscribers
 */
export async function subscribeToNewsletter(email: string): Promise<InsertNewsletterSubscriber> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const subscriber: InsertNewsletterSubscriber = {
      email,
      status: "subscribed",
    };

    const existing = await db
      .select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.email, email))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(newsletterSubscribers)
        .set({
          status: "subscribed",
          unsubscribedAt: null,
          subscribedAt: new Date(),
        })
        .where(eq(newsletterSubscribers.email, email));
    } else {
      await db.insert(newsletterSubscribers).values(subscriber);
    }

    // Send notification email
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER || 'your-email@gmail.com',
          pass: process.env.EMAIL_PASS || 'your-app-password'
        }
      });

      await transporter.sendMail({
        from: process.env.EMAIL_USER || 'your-email@gmail.com',
        to: 'pauloeugeniosouza@gmail.com',
        subject: 'Nova Subscrição na Newsletter - Ecos da Alma',
        html: `
          <h2>Nova subscrição na newsletter!</h2>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Data:</strong> ${new Date().toLocaleString('pt-PT')}</p>
          <br>
          <p>Alguém se inscreveu na newsletter do álbum "Ecos da Alma".</p>
        `
      });

      console.log(`Newsletter subscription notification sent for: ${email}`);
    } catch (emailError) {
      console.error('Failed to send newsletter notification email:', emailError);
      // Don't throw error - subscription still succeeded
    }

    return subscriber;
  } catch (error) {
    console.error("[Database] Failed to subscribe to newsletter:", error);
    throw error;
  }
}

export async function getNewsletterSubscriber(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get subscriber: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.email, email))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Memories (#MeuEco)
 */
export async function submitMemory(email: string, memory: string): Promise<InsertMemory> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const memoryData: InsertMemory = {
      email,
      memory,
      status: "pending",
    };

    await db.insert(memories).values(memoryData);

    return memoryData;
  } catch (error) {
    console.error("[Database] Failed to submit memory:", error);
    throw error;
  }
}

export async function getApprovedMemories() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get memories: database not available");
    return [];
  }

  try {
    const result = await db
      .select()
      .from(memories)
      .where(eq(memories.status, "approved"));

    return result;
  } catch (error) {
    console.error("[Database] Failed to get approved memories:", error);
    return [];
  }
}
