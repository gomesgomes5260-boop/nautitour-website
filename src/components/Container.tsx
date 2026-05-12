type Props = {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'main' | 'article' | 'aside' | 'header' | 'footer';
};

// Container responsivo com padding consistente em todas as breakpoints.
// Use sempre que precisar de "miolo" centralizado com respiro lateral.
export default function Container({ children, className = '', as: Tag = 'div' }: Props) {
  return (
    <Tag
      className={`mx-auto w-full max-w-7xl px-6 sm:px-8 md:px-10 lg:px-12 ${className}`}
    >
      {children}
    </Tag>
  );
}
