import fs from 'fs';
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "@langchain/openai";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from 'dotenv';

dotenv.config();

// ✅ Use SUPABASE_URL instead of NEXT_PUBLIC_SUPABASE_URL
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const openAiKey   = process.env.OPENAI_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function ingest() {
  const loader = new PDFLoader('./data/Show Operations Manual_2025.2.pdf');
  const docs = await loader.load();

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50,
  });
  const splitDocs = await splitter.splitDocuments(docs);

  const embeddings = new OpenAIEmbeddings({ openAIApiKey: openAiKey });

  const vectors = await Promise.all(
    splitDocs.map(async (doc) => {
      const embedding = await embeddings.embedQuery(doc.pageContent);
      return {
        content: doc.pageContent,
        metadata: doc.metadata,
        embedding,
      };
    })
  );

  const { error } = await supabase.from('documents').insert(vectors);
  if (error) throw error;

  console.log("✅ PDF uploaded to Supabase");
}

ingest();
