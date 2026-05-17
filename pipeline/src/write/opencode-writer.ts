import type { Writer, WriterInput, WriterOutput } from "./writer";

export class OpenCodeWriter implements Writer {
  async write(input: WriterInput): Promise<WriterOutput> {
    throw new Error("Not yet implemented: OpenCodeWriter.write");
  }
}
