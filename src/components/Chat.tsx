
'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Bot, Loader2, Send, User } from 'lucide-react';
import { format } from 'date-fns';

import type { Plant } from '@/lib/types';
import { chatAboutPlant } from '@/ai/flows/chat-about-plant';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import { useAchievementStore } from '@/hooks/use-achievement-store';

const chatFormSchema = z.object({
  question: z.string().min(1, 'Please enter a question.'),
});

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatProps {
  plant: Plant;
  initialContext?: string;
}

const suggestions = [
    "When should I water it?",
    "How much sunlight does it need?",
    "Based on my journal, is it healthy?",
    "Tell me a fun fact about this plant."
];

export function Chat({ plant, initialContext }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { checkAndUnlock } = useAchievementStore();
  const [chatCount, setChatCount] = useState(0);

  const form = useForm<z.infer<typeof chatFormSchema>>({
    resolver: zodResolver(chatFormSchema),
    defaultValues: {
      question: '',
    },
  });

  useEffect(() => {
    // Add initial context as the first message if provided
    if (initialContext) {
      setMessages([{ role: 'assistant', content: `Let's talk about these tips:\n\n*${initialContext}*` }]);
    }
  }, [initialContext]);


  useEffect(() => {
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (question: string) => {
    setIsLoading(true);
    const userMessage: Message = { role: 'user', content: question };
    setMessages((prev) => [...prev, userMessage]);
    form.reset();

    const journalEntries = plant.journal?.map(entry => ({
      date: format(new Date(entry.date), 'PPP'),
      notes: entry.notes,
    }));

    try {
      const result = await chatAboutPlant({
        plantName: plant.commonName,
        question: question,
        context: initialContext, // Pass the initial context to the flow
        journal: journalEntries,
        placement: plant.placement,
      });
      const assistantMessage: Message = { role: 'assistant', content: result.answer };
      setMessages((prev) => [...prev, assistantMessage]);

      const newChatCount = chatCount + 1;
      setChatCount(newChatCount);
      checkAndUnlock(['first_chat'], newChatCount);

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

  const onSubmit = (values: z.infer<typeof chatFormSchema>) => {
    handleSendMessage(values.question);
  };

  return (
    <div className="flex flex-col h-[60vh]">
      <ScrollArea className="flex-1 p-4 pr-6">
        <div className="space-y-4" ref={scrollAreaRef}>
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground p-4">
                <Bot className="mx-auto w-8 h-8 mb-2"/>
                <p>Ask me anything about your {plant.customName}. I can also analyze its journal for you.</p>
            </div>
          )}
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
                  'p-3 rounded-lg max-w-sm whitespace-pre-wrap',
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
           {isLoading && messages.length > 0 && messages[messages.length -1].role === 'user' && (
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
      <div className="p-4 border-t space-y-4">
        <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
                <Badge 
                    key={suggestion}
                    variant="outline"
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => handleSendMessage(suggestion)}
                >
                    {suggestion}
                </Badge>
            ))}
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-center gap-2">
            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input placeholder="Ask Sage a question..." {...field} disabled={isLoading} />
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
