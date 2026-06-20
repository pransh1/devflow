CREATE TABLE "Users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"username" varchar(50) NOT NULL,
	"passwored_hashed" varchar(255) NOT NULL,
	"full_name" varchar(100),
	"avatar_url" text,
	"is_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Users_email_unique" UNIQUE("email"),
	CONSTRAINT "Users_username_unique" UNIQUE("username")
);
