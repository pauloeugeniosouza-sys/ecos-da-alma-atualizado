import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { subscribeToNewsletter, submitMemory, getApprovedMemories } from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  newsletter: router({
    subscribe: publicProcedure
      .input(z.object({
        email: z.string().email("Email inválido"),
      }))
      .mutation(async ({ input }) => {
        try {
          await subscribeToNewsletter(input.email);
          return {
            success: true,
            message: "Subscrito com sucesso! Obrigado por te juntares a nós.",
          };
        } catch (error) {
          console.error("Newsletter subscription error:", error);
          if ((error as any)?.code === "ER_DUP_ENTRY") {
            return {
              success: false,
              message: "Este email já está subscrito.",
            };
          }
          throw error;
        }
      }),
  }),

  memories: router({
    submit: publicProcedure
      .input(z.object({
        email: z.string().email("Email inválido"),
        memory: z.string().min(10, "A memória deve ter pelo menos 10 caracteres").max(1000, "A memória não pode exceder 1000 caracteres"),
      }))
      .mutation(async ({ input }) => {
        try {
          await submitMemory(input.email, input.memory);
          return {
            success: true,
            message: "Obrigado por partilhares a tua memória! 🌟 A tua história será revista e publicada em breve.",
          };
        } catch (error) {
          console.error("Memory submission error:", error);
          throw error;
        }
      }),

    getApproved: publicProcedure.query(async () => {
      try {
        const memories = await getApprovedMemories();
        return {
          success: true,
          memories,
        };
      } catch (error) {
        console.error("Get memories error:", error);
        return {
          success: false,
          memories: [],
        };
      }
    }),
  }),
});

export type AppRouter = typeof appRouter;
