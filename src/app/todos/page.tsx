import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

interface Todo {
  id: string | number;
  name?: string;
  [key: string]: unknown;
}

export default async function Page() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: todos } = await supabase.from("todos").select();

  return (
    <div className="mx-auto max-w-md p-8 font-sans">
      <h1 className="mb-4 text-xl font-bold text-[#08093B] dark:text-[#F3F5FF]">Supabase Todos</h1>
      <ul className="list-disc pl-5 space-y-1 text-[#1B1D45] dark:text-[#DCE1F9]">
        {todos && todos.length > 0 ? (
          (todos as Todo[]).map((todo) => (
            <li key={todo.id}>{todo.name ?? JSON.stringify(todo)}</li>
          ))
        ) : (
          <li className="text-[#76799C] dark:text-[#9DA6CC]">
            No todos found (or table not yet created in Supabase).
          </li>
        )}
      </ul>
    </div>
  );
}
