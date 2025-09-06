'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Bot, Loader2, Send, User } from 'lucide-react';

import { chatAboutPlant } from '@/ai/flows/chat-about-plant';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const chatFormSchema = z.object({
  question: z.string().min(1, 'Please enter a question.'),
});

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatProps {
  plantName: string;
}

export function Chat({ plantName }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof chatFormSchema>>({
    resolver: zodResolver(chatFormSchema),
    defaultValues: {
      question: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof chatFormSchema>) => {
    setIsLoading(true);
    const userMessage: Message = { role: 'user', content: values.question };
    setMessages((prev) => [...prev, userMessage]);
    form.reset();

    try {
      const result = await chatAboutPlant({
        plantName,
        question: values.question,
      });
      const assistantMessage: Message = { role: 'assistant', content: result.answer };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat failed:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: "Sorry, I couldn't get a response. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[60vh]">
      <ScrollArea className="flex-1 p-4 pr-6">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                'flex items-start gap-3',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <Avatar className="w-8 h-8">
                  <AvatarFallback><Bot className="w-5 h-5" /></AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  'p-3 rounded-lg max-w-sm',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                <p className="text-sm">{message.content}</p>
              </div>
               {message.role === 'user' && (
                <Avatar className="w-8 h-8">
                  <AvatarFallback><User className="w-5 h-5" /></AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
           {isLoading && messages[messages.length -1].role === 'user' && (
             <div className="flex items-start gap-3 justify-start">
                <Avatar className="w-8 h-8">
                  <AvatarFallback><Bot className="w-5 h-5" /></AvatarFallback>
                </Avatar>
                <div className="p-3 rounded-lg bg-muted flex items-center">
                    <Loader2 className="w-5 h-5 animate-spin" />
                </div>
            </div>
           )}
        </div>
      </ScrollArea>
      <div className="p-4 border-t">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-center gap-2">
            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input placeholder="Ask about your plant..." {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} size="icon">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
