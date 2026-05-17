import type { Writer, WriterInput, WriterOutput } from "./writer";

export class SdkWriter implements Writer {
  async write(input: WriterInput): Promise<WriterOutput> {
    throw new Error("Not yet implemented: SdkWriter.write");
  }
}
