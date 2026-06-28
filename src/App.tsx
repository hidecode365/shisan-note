import { Button } from "@/components/ui/button";

function App() {
  return (
    <div className="p-8 flex flex-col gap-4">
      <h1 className="text-2xl font-bold">ShiSan Note</h1>
      <div className="flex gap-2">
        <Button>保存</Button>
        <Button variant="outline">キャンセル</Button>
        <Button variant="destructive">削除</Button>
      </div>
    </div>
  );
}

export default App;