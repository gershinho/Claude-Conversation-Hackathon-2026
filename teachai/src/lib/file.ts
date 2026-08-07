import type { PlanSource } from './claude'

const TEXT_EXTENSIONS = ['.txt', '.md', '.markdown', '.rtf', '.csv', '.json']

/** Reads an attached lesson plan into something the Messages API accepts. */
export async function readPlanFile(file: File): Promise<PlanSource> {
  const name = file.name.toLowerCase()

  if (file.type === 'application/pdf' || name.endsWith('.pdf')) {
    return { kind: 'pdf', filename: file.name, base64: await toBase64(file) }
  }

  if (file.type.startsWith('text/') || TEXT_EXTENSIONS.some((ext) => name.endsWith(ext))) {
    return { kind: 'text', filename: file.name, text: await file.text() }
  }

  if (name.endsWith('.docx') || name.endsWith('.doc') || name.endsWith('.pages')) {
    throw new Error(
      `Word documents cannot be read directly. Export "${file.name}" as PDF, or paste the plan straight into the message box.`,
    )
  }

  throw new Error(`Cannot read ${file.name}. Attach a PDF or a plain text file, or paste the plan into the message box.`)
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Strip the "data:application/pdf;base64," prefix.
      resolve(result.slice(result.indexOf(',') + 1))
    }
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`))
    reader.readAsDataURL(file)
  })
}
