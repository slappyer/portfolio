import nodemailer from "nodemailer";

export const prerender = false;

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function POST({ request }) {
  try {
    const body = await request.json();
    const name = (body?.name ?? "").toString().trim();
    const email = (body?.email ?? "").toString().trim();
    const service = (body?.service ?? "").toString().trim();
    const message = (body?.message ?? "").toString().trim();

    if (!name || !email || !service || !message) {
      return new Response(JSON.stringify({ ok: false, error: "Faltan campos obligatorios." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const transporter = nodemailer.createTransport({
      host: import.meta.env.SMTP_HOST,
      port: Number(import.meta.env.SMTP_PORT),
      secure: import.meta.env.SMTP_SECURE === "true",
      auth: {
        user: import.meta.env.SMTP_USER,
        pass: import.meta.env.SMTP_PASS
      }
    });

    const fromAddress = `"slappyer.com" <${import.meta.env.SMTP_USER}>`;

    // 1) Aviso interno con los datos del formulario
    await transporter.sendMail({
      from: fromAddress,
      to: import.meta.env.CONTACT_TO,
      replyTo: email,
      subject: `Nuevo contacto: ${name} - ${service}`,
      text: `Nombre: ${name}\nCorreo: ${email}\nServicio: ${service}\n\nMensaje:\n${message}`,
      html: `
        <p><strong>Nombre:</strong> ${escapeHtml(name)}</p>
        <p><strong>Correo:</strong> ${escapeHtml(email)}</p>
        <p><strong>Servicio:</strong> ${escapeHtml(service)}</p>
        <p><strong>Mensaje:</strong></p>
        <p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
      `
    });

    // 2) Respuesta automática a la persona que ha rellenado el formulario
    await transporter.sendMail({
      from: fromAddress,
      to: email,
      subject: "Gracias por contactar",
      text: `Hola ${name},\n\nGracias por contactar, estoy revisando tu propuesta.\n\nUn saludo,\nRafael`,
      html: `
        <p>Hola ${escapeHtml(name)},</p>
        <p>Gracias por contactar, estoy revisando tu propuesta.</p>
        <p>Un saludo,<br>Rafael</p>
      `
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error enviando email de contacto:", error);
    return new Response(JSON.stringify({ ok: false, error: "No se pudo enviar el mensaje." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
