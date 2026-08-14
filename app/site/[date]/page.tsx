import { redirect } from "next/navigation";

import { SitePicker } from "./SitePicker";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * params 는 Next 16 에서 Promise 라 서버에서 풀어 넘긴다.
 * 화면 자체는 터치로 조작하므로 클라이언트 컴포넌트가 맡는다.
 */
export default async function Page(props: PageProps<"/site/[date]">) {
  const { date } = await props.params;

  // 주소를 직접 고쳐 들어오는 경우를 막는다.
  if (!DATE_RE.test(date) || Number.isNaN(Date.parse(date))) {
    redirect("/");
  }

  return <SitePicker date={date} />;
}
